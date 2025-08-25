import { Badge } from '@/components/ui/badge';
import { PlanTier } from '@/types/docs';
import { Crown, Star, Zap, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  plan: PlanTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PlanBadge({ 
  plan, 
  size = 'sm', 
  showIcon = true,
  className 
}: PlanBadgeProps) {
  const planConfig = {
    FREE: {
      label: 'Free',
      icon: Star,
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    BASIC: {
      label: 'Basic',
      icon: Zap,
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    PRO: {
      label: 'Pro',
      icon: Crown,
      variant: 'default' as const,
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    },
    ENTERPRISE: {
      label: 'Enterprise',
      icon: Building,
      variant: 'default' as const,
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    }
  };

  const config = planConfig[plan];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium inline-flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

interface PlanComparisonProps {
  plans: PlanTier[];
  currentPlan?: PlanTier;
  className?: string;
}

export function PlanComparison({ 
  plans, 
  currentPlan,
  className 
}: PlanComparisonProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {plans.map((plan) => (
        <PlanBadge
          key={plan}
          plan={plan}
          size="md"
          className={cn(
            currentPlan === plan && 'ring-2 ring-primary ring-offset-2'
          )}
        />
      ))}
    </div>
  );
}