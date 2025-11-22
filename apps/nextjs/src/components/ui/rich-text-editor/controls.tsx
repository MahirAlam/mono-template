import type { Editor } from "@tiptap/react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import {
  Bold,
  Code,
  Italic,
  List,
  ListOrdered,
  LucideProps,
  Quote,
  RotateCcw,
  RotateCw,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

export type Control = {
  key: string;
  aria: string;
  isActive: () => boolean | undefined;
  run: () => void;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
};

export function getInlineControls(editor: Editor | null): Control[] {
  return [
    {
      key: "bold",
      aria: "Toggle bold",
      isActive: () => editor?.isActive("bold"),
      run: () => editor?.chain().focus().toggleBold().run(),
      Icon: Bold,
    },
    {
      key: "italic",
      aria: "Toggle italic",
      isActive: () => editor?.isActive("italic"),
      run: () => editor?.chain().focus().toggleItalic().run(),
      Icon: Italic,
    },
    {
      key: "strike",
      aria: "Toggle strike",
      isActive: () => editor?.isActive("strike"),
      run: () => editor?.chain().focus().toggleStrike().run(),
      Icon: Strikethrough,
    },
    {
      key: "underline",
      aria: "Toggle underline",
      isActive: () => editor?.isActive("underline"),
      run: () => editor?.chain().focus().toggleUnderline().run(),
      Icon: UnderlineIcon,
    },
  ];
}

export function getBlockControls(editor: Editor | null): Control[] {
  return [
    {
      key: "codeBlock",
      aria: "Toggle code block",
      isActive: () => editor?.isActive("codeBlock"),
      run: () => editor?.chain().focus().toggleCodeBlock().run(),
      Icon: Code,
    },
    {
      key: "blockquote",
      aria: "Toggle blockquote",
      isActive: () => editor?.isActive("blockquote"),
      run: () => editor?.chain().focus().toggleBlockquote().run(),
      Icon: Quote,
    },
  ];
}

export function getListControls(editor: Editor | null): Control[] {
  return [
    {
      key: "bulletList",
      aria: "Toggle bullet list",
      isActive: () => editor?.isActive("bulletList"),
      run: () => editor?.chain().focus().toggleBulletList().run(),
      Icon: List,
    },
    {
      key: "orderedList",
      aria: "Toggle ordered list",
      isActive: () => editor?.isActive("orderedList"),
      run: () => editor?.chain().focus().toggleOrderedList().run(),
      Icon: ListOrdered,
    },
  ];
}

export function getMiscControls(editor: Editor | null): Control[] {
  return [
    {
      key: "undo",
      aria: "Undo",
      isActive: () => false,
      run: () => editor?.chain().focus().undo().run(),
      Icon: RotateCcw,
    },
    {
      key: "redo",
      aria: "Redo",
      isActive: () => false,
      run: () => editor?.chain().focus().redo().run(),
      Icon: RotateCw,
    },
  ];
}
