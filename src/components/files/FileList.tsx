'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, Loader2, FileIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/utils/formatters';

interface File {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
  };
}

interface FileListProps {
  chapterSlug: string;
  userId: string;
}

export function FileList({ chapterSlug, userId }: FileListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // toast is imported directly

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['files', chapterSlug, currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/chapters/${chapterSlug}/files?page=${currentPage}`);
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

  // Check if user can delete a file (uploader or admin)
  const canDeleteFile = (file: File) => {
    return file.uploader.id === userId;
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

  const { files, pagination } = data;

  if (files.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>No Files Yet</CardTitle>
          <CardDescription>
            Upload your first file using the upload area above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
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
                <TableCell>{file.uploader.name}</TableCell>
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
    </>
  );
}
