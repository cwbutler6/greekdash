'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';

interface FileUploadButtonProps {
  chapterSlug: string;
  className?: string;
}

export function FileUploadButton({ chapterSlug, className }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setShowDialog(true);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setShowDialog(true);
      }
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `/api/chapters/${chapterSlug}/files/upload`);
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success(`${selectedFile.name} has been uploaded successfully`);
          
          // Reset state
          setSelectedFile(null);
          setIsUploading(false);
          setShowDialog(false);
          
          // Refresh file list
          queryClient.invalidateQueries({ queryKey: ['files', chapterSlug] });
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            setError(errorResponse.error || 'Upload failed');
          } catch {
            setError('Upload failed. Please try again.');
          }
          setIsUploading(false);
        }
      };
      
      xhr.onerror = function() {
        setError('Network error occurred');
        setIsUploading(false);
      };
      
      xhr.send(formData);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred');
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setShowDialog(false);
    setError(null);
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 dark:border-gray-700'}
          ${className}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleSelectFile}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center py-4">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">
            <span className="text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Files up to 10MB
          </p>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {selectedFile && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate max-w-[250px]">
                  {selectedFile.name}
                </span>
                
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelUpload}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mb-2">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    {uploadProgress}%
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-4">
                {!isUploading && (
                  <>
                    <Button
                      variant="outline"
                      onClick={cancelUpload}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      Upload
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
