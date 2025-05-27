'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, Loader2, FileIcon, AlertCircle, Edit, Save, FolderIcon, ChevronRight, Home, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { formatBytes } from '@/lib/utils/formatters';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface File {
  id: string;
  name: string;
  path: string;
  displayPath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
  };
}

interface Folder {
  name: string;
  path: string;
  isFolder: boolean;
}

interface AdminFileListProps {
  chapterSlug: string;
  userId: string;
  initialFolderPath?: string;
}

export function AdminFileList({ chapterSlug, userId, initialFolderPath = '/' }: AdminFileListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterUploader, setFilterUploader] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentFolder, setCurrentFolder] = useState(initialFolderPath);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-files', chapterSlug, currentPage, filterUploader, sortBy, currentFolder],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        folder: currentFolder,
      });
      
      if (filterUploader) {
        queryParams.append('uploader', filterUploader);
      }
      
      if (sortBy) {
        queryParams.append('sort', sortBy);
      }
      
      queryParams.append('admin', 'true'); // This is an admin request

      const response = await fetch(`/api/chapters/${chapterSlug}/files?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }
      return response.json();
    }
  });
  
  // Build breadcrumb segments from current path
  const pathSegments = currentFolder.split('/').filter(Boolean);
  
  // Handle folder navigation
  const navigateToFolder = (folderPath: string) => {
    setCurrentFolder(folderPath);
    setCurrentPage(1); // Reset to first page when changing folders
  };
  
  // Navigate to parent folder
  const navigateUp = () => {
    if (currentFolder === '/') return;
    
    const segments = currentFolder.split('/').filter(Boolean);
    segments.pop(); // Remove the last segment
    const parentPath = segments.length ? `/${segments.join('/')}` : '/';
    navigateToFolder(parentPath);
  };
  
  // Create a new folder
  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a name for the new folder", {
        description: "Folder name is required",
      });
      return;
    }
    
    setIsCreatingFolder(true);
    
    try {
      // Sanitize folder name to avoid path traversal issues
      const sanitizedName = newFolderName.trim().replace(/[\\/:*?"<>|]/g, '-');
      
      // Calculate the new folder's path
      const newFolderPath = currentFolder === '/' 
        ? `/${sanitizedName}` 
        : `${currentFolder}/${sanitizedName}`;
      
      // Create an empty file with a special marker in the folder to represent it
      // This is a workaround since we're not using a separate Folder model
      const formData = new FormData();
      const emptyBlob = new Blob([""], { type: "text/plain" });
      const placeholderFile = new File([emptyBlob], ".folder_placeholder", {
        type: "text/plain",
      });
      formData.append('file', placeholderFile);
      formData.append('folderPath', newFolderPath);
      
      const response = await fetch(`/api/chapters/${chapterSlug}/files`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }
      
      // Reset states
      setNewFolderName('');
      setShowNewFolderDialog(false);
      refetch(); // Refresh the file list
      
      toast.success(`Folder "${sanitizedName}" has been created`, {
        description: "Folder created successfully",
      });
    } catch (error: unknown) {
      console.error('Create folder error:', error);
      toast.error("Error creating folder", {
        description: error instanceof Error ? error.message : 'Folder creation failed',
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/files/${fileId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate download link');
      }
      
      const { url } = await response.json();
      
      // Open the download URL in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : 'Could not download file',
      });
    }
  };

  const openDeleteDialog = (file: File) => {
    setFileToDelete(file);
  };
  
  const closeDeleteDialog = () => {
    setFileToDelete(null);
  };
  
  // Check if user can delete a file (any file if admin, or only their uploads for regular members)
  const canDeleteFile = (file: File) => {
    // Admin users can delete any file, regular members can only delete their own uploads
    return file.uploader.id === userId;
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(
        `/api/chapters/${chapterSlug}/files/${fileToDelete.id}/delete?admin=true`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      toast.success("File deleted successfully");
      refetch(); // Refresh the file list
    } catch (err) {
      console.error('Delete error:', err);
      toast.error("Could not delete file", {
        description: err instanceof Error ? err.message : 'Delete operation failed',
      });
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  const openEditDialog = (file: File) => {
    setFileToEdit(file);
    setEditedName(file.name);
  };
  
  const closeEditDialog = () => {
    setFileToEdit(null);
    setEditedName('');
  };
  
  const confirmEdit = async () => {
    if (!fileToEdit || !editedName.trim()) return;
    
    setIsEditing(true);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/files/${fileToEdit.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update file');
      }
      
      toast.success(`File has been renamed to ${editedName}`, {
        description: "File updated successfully",
      });
      
      // Refetch the data
      refetch();
    } catch (err) {
      console.error('Edit error:', err);
      toast.error("Could not update file", {
        description: err instanceof Error ? err.message : 'Update operation failed',
      });
    } finally {
      setIsEditing(false);
      setFileToEdit(null);
    }
  };

  // Extract data from the query response
  const files = data?.files || [];
  const folders = data?.folders || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1, totalSize: 0 };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {isError && (
        <div className="mb-4 rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <p>
              Error loading files: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}
      
      {!isLoading && !isError && files.length === 0 && folders.length === 0 && (
        <div className="mb-4 rounded-md bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <p>
              No files have been uploaded to this chapter yet.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb className="overflow-hidden">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigateToFolder('/')} className="cursor-pointer">
                    <Home size={16} className="mr-1" />
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                {pathSegments.map((segment, index) => {
                  // Build the path up to this segment
                  const segmentPath = `/${pathSegments.slice(0, index + 1).join('/')}`;
                  
                  return (
                    <BreadcrumbItem key={index}>
                      <BreadcrumbSeparator><ChevronRight size={16} /></BreadcrumbSeparator>
                      <BreadcrumbLink 
                        onClick={() => navigateToFolder(segmentPath)}
                        className="cursor-pointer truncate max-w-[120px] md:max-w-xs"
                      >
                        {segment}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex space-x-2">
              {currentFolder !== '/' && (
                <Button variant="outline" size="sm" onClick={navigateUp}>
                  <ArrowUp size={16} className="mr-1" />
                  Up
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
                <FolderIcon size={16} className="mr-1" />
                New Folder
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select 
                value={filterUploader || ''} 
                onValueChange={(value) => setFilterUploader(value || null)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by uploader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All uploaders</SelectItem>
                  {data.uploaders?.map((uploader: {id: string, name: string}) => (
                    <SelectItem key={uploader.id} value={uploader.id}>
                      {uploader.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={sortBy} 
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="size">Size (largest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {pagination.total} files • {formatBytes(pagination.totalSize || 0)} total
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Folders first */}
                {folders.map((folder: Folder) => (
                  <TableRow key={`folder-${folder.path}`}>
                    <TableCell className="font-medium">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToFolder(folder.path)}
                      >
                        <FolderIcon size={18} className="text-amber-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={folder.name}>
                          {folder.name}/
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToFolder(folder.path)}
                      >
                        <ChevronRight size={16} />
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Then files */}
                {files.filter((file: File) => file.displayPath === currentFolder).map((file: File) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileIcon size={18} className="text-blue-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{file.uploader?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.id)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(file)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDeleteFile(file) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(file)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* New Folder Dialog */}
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for the new folder in {currentFolder === '/' ? 'root' : currentFolder}
                </DialogDescription>
              </DialogHeader>
              
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="mt-2"
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setNewFolderName('');
                  setShowNewFolderDialog(false);
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={createNewFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                >
                  {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={!!fileToDelete} onOpenChange={closeDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete File</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={!!fileToEdit} onOpenChange={closeEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit File</DialogTitle>
                <DialogDescription>
                  Update the file details below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="editName" className="text-right text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="editName"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditDialog} disabled={isEditing}>
                  Cancel
                </Button>
                <Button onClick={confirmEdit} disabled={isEditing || !editedName.trim()}>
                  {isEditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
