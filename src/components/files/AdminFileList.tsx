'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, Loader2, FileIcon, AlertCircle, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/utils/formatters';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface File {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
  };
}

interface AdminFileListProps {
  chapterSlug: string;
  userId: string;
}

export function AdminFileList({ chapterSlug, userId }: AdminFileListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterUploader, setFilterUploader] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-files', chapterSlug, currentPage, filterUploader, sortBy],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
      });
      
      if (filterUploader) {
        queryParams.append('uploader', filterUploader);
      }
      
      queryParams.append('sort', sortBy);
      
      const response = await fetch(`/api/chapters/${chapterSlug}/files?${queryParams.toString()}&admin=true`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }
      return response.json();
    }
  });

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
      toast.error(err instanceof Error ? err.message : 'Could not download file', {
        description: 'Download failed',
      });
    }
  };

  const openDeleteDialog = (file: File) => {
    setFileToDelete(file);
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
      
      toast.success(`${fileToDelete.name} has been deleted`, {
        description: 'File deleted',
      });
      
      // Refetch the data
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not delete file', {
        description: 'Delete failed',
      });
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  const closeDeleteDialog = () => {
    setFileToDelete(null);
  };

  const openEditDialog = (file: File) => {
    setFileToEdit(file);
    setEditedName(file.name);
  };

  const confirmEdit = async () => {
    if (!fileToEdit) return;
    
    setIsEditing(true);
    
    try {
      const response = await fetch(
        `/api/chapters/${chapterSlug}/files/${fileToEdit.id}?admin=true`,
        { 
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedName,
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update file');
      }
      
      toast.success(`File has been renamed to ${editedName}`, {
        description: 'File updated',
      });
      
      // Refetch the data
      refetch();
    } catch (err) {
      console.error('Edit error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not update file', {
        description: 'Update failed',
      });
    } finally {
      setIsEditing(false);
      setFileToEdit(null);
    }
  };

  const closeEditDialog = () => {
    setFileToEdit(null);
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
            {error instanceof Error ? error.message : 'Failed to load files. Please try again.'}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const { files, pagination, uploaders } = data;

  if (files.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>No Files Yet</CardTitle>
          <CardDescription>
            No files have been uploaded to this chapter yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
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
              {uploaders && uploaders.map((uploader: {id: string, name: string}) => (
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
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file: File) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </TableCell>
                <TableCell>{file.uploader.name || 'Unknown'}</TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {file.mimeType.split('/')[1] || file.mimeType}
                  </Badge>
                </TableCell>
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
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
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
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="fileName" className="text-sm font-medium">
                File Name
              </label>
              <Input
                id="fileName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
            
            {fileToEdit && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">File Details</p>
                <p className="text-muted-foreground">
                  Size: {fileToEdit ? formatBytes(fileToEdit.size) : ''}
                </p>
                <p className="text-muted-foreground">
                  Type: {fileToEdit ? fileToEdit.mimeType : ''}
                </p>
                <p className="text-muted-foreground">
                  Uploaded by: {fileToEdit && fileToEdit.uploader ? fileToEdit.uploader.name : 'Unknown'}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmEdit}
              disabled={isEditing || !editedName.trim()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
