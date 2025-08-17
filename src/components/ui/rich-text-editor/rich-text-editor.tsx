'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type EditorProps } from './types';
import { EditorToolbar } from './editor-toolbar';
import { CharacterCount as CharacterCountDisplay } from './character-count';

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  maxLength = 5000,
  className,
  disabled = false,
}: EditorProps) {
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

  const handleAddLink = useCallback(() => {
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

  const handleToggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

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

  return (
    <div className={cn(
      'border rounded-md transition-colors',
      isFocused && 'ring-2 ring-blue-500 ring-offset-2 border-blue-500',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        onAddLink={handleAddLink}
        onToggleEmojiPicker={handleToggleEmojiPicker}
        showEmojiPicker={showEmojiPicker}
      />

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
      </div>

      <CharacterCountDisplay
        current={characterCount}
        max={maxLength}
      />
    </div>
  );
}