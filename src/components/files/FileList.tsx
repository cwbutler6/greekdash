'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, Loader2, FileIcon, AlertCircle, FolderIcon, ChevronRight, Home, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatBytes } from '@/lib/utils/formatters';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { createComponentLogger } from '@/lib/logger';

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
    name: string;
  };
}

interface Folder {
  name: string;
  path: string;
  isFolder: boolean;
}

interface FileListProps {
  chapterSlug: string;
  userId: string;
  initialFolderPath?: string;
}

export function FileList({ chapterSlug, userId, initialFolderPath = '/' }: FileListProps) {
  const logger = createComponentLogger('FileList');
  const [currentPage, setCurrentPage] = useState(1);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(initialFolderPath);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Get files and folders for the current path
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['files', chapterSlug, currentPage, currentFolder],
    queryFn: async () => {
      const response = await fetch(`/api/chapters/${chapterSlug}/files?page=${currentPage}&folder=${encodeURIComponent(currentFolder)}`);
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
      toast.error('Please enter a name for the new folder', {
        description: 'Folder name is required',
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
        description: 'Folder created successfully',
      });
    } catch (error: unknown) {
      logger.error('Failed to create folder', error instanceof Error ? error : new Error('Unknown error'), {
        chapterSlug,
        metadata: {
          folderName: newFolderName,
          currentFolder,
        },
        action: 'create_folder'
      });
      toast.error('Error creating folder', {
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
    } catch (err: unknown) {
      logger.error('Failed to download file', err instanceof Error ? err : new Error('Unknown error'), {
        chapterSlug,
        metadata: {
          fileId,
        },
        action: 'download'
      });
      toast.error(err instanceof Error ? err.message : 'Could not download file', {
        description: 'Download failed',
      });
    }
  };

  const openDeleteDialog = (file: File) => {
    setFileToDelete(file);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(
        `/api/chapters/${chapterSlug}/files/${fileToDelete.id}/delete`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      toast.success(`${fileToDelete.name} has been deleted`, {
        description: 'File deleted',
      });
      
      // Invalidate and refetch
      window.location.reload();
    } catch (err) {
      logger.error('Failed to delete file', err instanceof Error ? err : new Error('Unknown error'), {
        chapterSlug,
        metadata: {
          fileId: fileToDelete.id,
          fileName: fileToDelete.name,
        },
        action: 'delete'
      });
      toast.error(err instanceof Error ? err.message : 'Could not delete file', {
        description: 'Delete failed',
      });
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  // Use this in Dialog onOpenChange
  const handleDialogChange = (open: boolean) => {
    if (!open) setFileToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            {(error as Error)?.message || 'Failed to load files. Please try again.'}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const { files, folders, pagination } = data;

  if (files.length === 0 && folders.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>No Files or Folders Yet</CardTitle>
          <CardDescription>
            Upload your first file or create a new folder using the buttons above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle size={18} />
              <p>Error loading files: {(error as Error)?.message || 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.files?.length === 0 && data?.folders?.length === 0 && !isLoading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertCircle size={18} />
              <p>This folder is empty.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Folders first */}
              {folders?.map((folder: Folder) => (
                <TableRow key={`folder-${folder.path}`}>
                  <TableCell className="font-medium">
                    <div 
                      className="flex items-center space-x-2 cursor-pointer hover:text-blue-600"
                      onClick={() => navigateToFolder(folder.path)}
                    >
                      <FolderIcon size={18} className="text-amber-500" />
                      <span className="truncate max-w-[200px]" title={folder.name}>
                        {folder.name}/
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>--</TableCell>
                  <TableCell>--</TableCell>
                  <TableCell>
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
              {files?.map((file: File) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <FileIcon size={18} className="text-blue-500" />
                      <span className="truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                      >
                        <Download size={16} className="mr-1" />
                        Download
                      </Button>

                      {/* Only allow users to delete their own files */}
                      {userId === file.uploader.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteDialog(file)}
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {files.length} files 
                {folders?.length > 0 && `and ${folders.length} folders`}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
