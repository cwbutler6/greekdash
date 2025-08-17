'use client';

import { Button } from '@/components/ui/button';
import { EMOJI_LIST, type EmojiPickerProps } from './types';

export function EmojiPicker({ onEmojiSelect, onClose, isVisible }: EmojiPickerProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Picker */}
      <div className="absolute top-10 left-0 z-50 bg-white border rounded-md shadow-lg p-2 w-64 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEmojiSelect(emoji)}
              className="p-1 h-8 w-8 text-lg hover:bg-gray-100 transition-colors"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}