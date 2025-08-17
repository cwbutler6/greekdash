'use client';

import { type CharacterCountProps } from './types';
import { cn } from '@/lib/utils';

export function CharacterCount({ current, max }: CharacterCountProps) {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;

  return (
    <div className="flex justify-end p-2 border-t bg-gray-50 text-sm">
      <span
        className={cn(
          'text-gray-500',
          isNearLimit && 'text-yellow-600',
          isOverLimit && 'text-red-600'
        )}
      >
        {current} / {max}
      </span>
    </div>
  );
}