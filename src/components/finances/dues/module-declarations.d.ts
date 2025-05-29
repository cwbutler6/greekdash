// Type declarations for local modules
declare module './edit-dues-plan-dialog' {
  interface EditDuesPlanDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    plan: {
      id: string;
      name: string;
      description?: string | null;
      amount: number;
      frequency: string;
      isActive: boolean;
      applyToNewMembers: boolean;
    };
  }
  export function EditDuesPlanDialog(props: EditDuesPlanDialogProps): JSX.Element;
}

declare module './assign-dues-dialog' {
  interface DuesPlan {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    frequency: string;
    isActive: boolean;
  }
  
  interface AssignDuesDialogProps {
    children: React.ReactNode;
    duesPlans: DuesPlan[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  export function AssignDuesDialog(props: AssignDuesDialogProps): JSX.Element;
}
