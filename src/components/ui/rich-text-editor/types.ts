import type { Editor } from '@tiptap/react';

export interface EditorProps {
  content?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

export interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  onAddLink: () => void;
  onToggleEmojiPicker: () => void;
  showEmojiPicker: boolean;
}

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export interface CharacterCountProps {
  current: number;
  max: number;
}

export const EMOJI_LIST = [
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
] as const;

export type EmojiType = typeof EMOJI_LIST[number];