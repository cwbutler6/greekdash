// Re-export sonner directly
export { toast, Toaster } from 'sonner';

// Define a type for toast notifications
export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

