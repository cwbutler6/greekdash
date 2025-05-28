'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Camera, Upload, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProfileImageUploadProps {
  chapterSlug: string;
  profileImage?: string | null;
  userName?: string | null;
  onImageUpdate?: (imageUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function ProfileImageUpload({
  chapterSlug,
  profileImage,
  userName,
  onImageUpdate,
  size = 'md',
  editable = true,
}: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size mapping
  const sizeMap = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        `/api/chapters/${chapterSlug}/profile/image`,
        formData
      );
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewUrl(null);
      toast.success('Profile image updated successfully');
      if (onImageUpdate) {
        onImageUpdate(data.profileImage);
      }
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(
        `Failed to upload image: ${error.response?.data?.error || error.message}`
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
        `/api/chapters/${chapterSlug}/profile/image`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile image removed');
      if (onImageUpdate) {
        onImageUpdate(null);
      }
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(
        `Failed to remove image: ${error.response?.data?.error || error.message}`
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

  // Remove profile image
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

  // Get initials for fallback
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <Avatar className={`${sizeMap[size]} border-2`}>
          <AvatarImage
            src={previewUrl || profileImage || ''}
            alt={userName || 'User profile'}
          />
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>

        {editable && (
          <div className="absolute -right-2 -bottom-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            {profileImage && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Preview and upload controls */}
      {previewUrl && (
        <div className="flex w-full gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={handleUpload}
            disabled={isUploading}
          >
            <Upload className="mr-1 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Save'}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your profile picture. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
