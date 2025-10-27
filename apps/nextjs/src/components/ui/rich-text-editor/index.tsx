// components/ui/rich-text-editor/index.tsx
import type { Editor, JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { getRichTextEditorExtensions } from "./extensions";

type ToolbarProps = { editor: Editor | null };

const EditorToolbar = ({ editor }: ToolbarProps) => {
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  const handleToggleState = useCallback(() => {
    if (!editor) return;
    const active: string[] = [];
    if (editor.isActive("bold")) active.push("bold");
    if (editor.isActive("italic")) active.push("italic");
    if (editor.isActive("strike")) active.push("strike");
    if (editor.isActive("underline")) active.push("underline");
    if (editor.isActive("bulletList")) active.push("bulletList");
    if (editor.isActive("orderedList")) active.push("orderedList");
    setActiveToggles(active);
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.on("transaction", handleToggleState);
      return () => {
        editor.off("transaction", handleToggleState);
      };
    }
  }, [editor, handleToggleState]);

  if (!editor) return null;

  return (
    <>
      <div className="border-input flex flex-row gap-2 rounded-b-xl border border-t-0 bg-transparent p-1">
        <ToggleGroup
          className="border-border/50 border shadow"
          type="multiple"
          size="sm"
          value={activeToggles}
        >
          <ToggleGroupItem
            value="bold"
            aria-label="Toggle bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Toggle italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="strike"
            aria-label="Toggle strike"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Toggle underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="multiple"
          size="sm"
          value={activeToggles}
          className="border-border/50 border shadow"
        >
          <ToggleGroupItem
            value="bulletList"
            aria-label="Toggle bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="orderedList"
            aria-label="Toggle ordered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </>
  );
};

export type RichTextEditorProps = {
  value: JSONContent | null;
  onChange: (content: JSONContent | null) => void;
  placeholder?: string;
  getLinkPreview?: (url: string) => void;
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  getLinkPreview,
}: RichTextEditorProps) => {
  // Removed trpcUtils as fetching is now handled in SuggestionList component
  const editor = useEditor({
    extensions: getRichTextEditorExtensions(placeholder, getLinkPreview),
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className="flex flex-col">
      <EditorContent editor={editor} />
      <EditorToolbar editor={editor} />
    </div>
  );
};
