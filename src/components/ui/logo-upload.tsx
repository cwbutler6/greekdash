'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LogoUploadProps {
  chapterSlug: string;
  logoUrl?: string | null;
  onLogoUpdate?: (logoUrl: string | null) => void;
  className?: string;
}

export function LogoUpload({
  chapterSlug,
  logoUrl,
  onLogoUpdate,
  className = '',
}: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add cache-busting timestamp for the logo URL - fix URL formatting
  const logoSrc = logoUrl && !previewUrl
    ? logoUrl.startsWith('http')
      ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      : logoUrl.startsWith('/')
        ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
        : `/${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
    : previewUrl;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        `/api/chapters/${chapterSlug}/logo`,
        formData
      );
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewUrl(null);
      toast.success('Chapter logo updated successfully');
      if (onLogoUpdate) {
        onLogoUpdate(data.logoUrl);
      }
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(
        `Failed to upload logo: ${error.response?.data?.error || error.message}`
      );
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `/api/chapters/${chapterSlug}/logo`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Chapter logo removed');
      if (onLogoUpdate) {
        onLogoUpdate(null);
      }
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(
        `Failed to remove logo: ${error.response?.data?.error || error.message}`
      );
    },
    onSettled: () => {
      setShowDeleteDialog(false);
    },
  });

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload selected file
  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  // Remove logo
  const handleRemove = () => {
    deleteMutation.mutate();
  };

  // Cancel upload
  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Logo Display */}
        <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          {logoSrc ? (
            <>
              <Image
                src={logoSrc}
                alt="Chapter logo"
                fill
                className="object-contain rounded-lg"
                sizes="128px"
              />
              {(logoUrl || previewUrl) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No logo uploaded</p>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        {previewUrl ? (
          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? 'Uploading...' : 'Save Logo'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Logo</span>
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload chapter logo"
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Logo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the chapter logo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove Logo'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}