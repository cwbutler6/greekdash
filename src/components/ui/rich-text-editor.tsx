'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
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
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
  '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
  '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
  '🖖', '👏', '🙌', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
  '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
  '👁️', '👅', '👄', '💋', '🩸'
];

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  maxLength = 5000,
  className,
  disabled = false,
}: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onCreate: () => {
      setIsInitialized(true);
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      setIsFocused(false);
    },
    editable: !disabled,
    immediatelyRender: false,
  }, [content, onChange, placeholder, maxLength, disabled]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && isInitialized && editor.getHTML() !== content) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [editor, content, isInitialized]);

  const addLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  }, [editor]);

  // Show loading state while editor initializes
  if (!editor || !isInitialized) {
    return (
      <div className={cn('border rounded-md p-4', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const characterCount = editor.storage.characterCount?.characters() || 0;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={cn(
      'border rounded-md transition-colors',
      isFocused && 'ring-2 ring-blue-500 ring-offset-2 border-blue-500',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      {/* Toolbar */}
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
          onClick={addLink}
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
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute top-10 left-0 z-50 bg-white border rounded-md shadow-lg p-2 w-64 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="p-1 hover:bg-gray-100 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* Editor Content */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none p-3 min-h-[120px]',
            '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[120px]',
            '[&_.ProseMirror]:focus:outline-none',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Click outside to close emoji picker */}
        {showEmojiPicker && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {/* Character Count */}
      <div className="flex justify-end p-2 border-t bg-gray-50 text-sm">
        <span
          className={cn(
            'text-gray-500',
            isNearLimit && 'text-yellow-600',
            isOverLimit && 'text-red-600'
          )}
        >
          {characterCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}