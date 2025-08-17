'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Smile,
} from 'lucide-react';
import { type ToolbarProps } from './types';
import { EmojiPicker } from './emoji-picker';
import { cn } from '@/lib/utils';

export function EditorToolbar({
  editor,
  disabled = false,
  onAddLink,
  onToggleEmojiPicker,
  showEmojiPicker,
}: ToolbarProps) {
  if (!editor) return null;

  const handleEmojiSelect = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('bold') && 'bg-gray-200'
        )}
        disabled={disabled}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('italic') && 'bg-gray-200'
        )}
        disabled={disabled}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('bulletList') && 'bg-gray-200'
        )}
        disabled={disabled}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('orderedList') && 'bg-gray-200'
        )}
        disabled={disabled}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAddLink}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('link') && 'bg-gray-200'
        )}
        disabled={disabled}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleEmojiPicker}
          className="h-8 w-8 p-0"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
        
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => onToggleEmojiPicker()}
          isVisible={showEmojiPicker}
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        className="h-8 w-8 p-0"
        disabled={!editor.can().chain().focus().undo().run() || disabled}
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        className="h-8 w-8 p-0"
        disabled={!editor.can().chain().focus().redo().run() || disabled}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}