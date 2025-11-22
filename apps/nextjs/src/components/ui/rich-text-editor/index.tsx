// components/ui/rich-text-editor/index.tsx
import type { Editor, JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";
import {
  getBlockControls,
  getInlineControls,
  getListControls,
  getMiscControls,
} from "./controls";
import { getRichTextEditorExtensions } from "./extensions";

interface ToolbarProps {
  editor: Editor | null;
}

const EditorToolbar = ({ editor }: ToolbarProps) => {
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  const controls = getInlineControls(editor);
  const blockControls = getBlockControls(editor);
  const listControls = getListControls(editor);
  const miscControls = getMiscControls(editor);

  const handleToggleState = useCallback(() => {
    if (!editor) return;
    const active: string[] = [];
    [...controls, ...blockControls, ...listControls, ...miscControls].forEach(
      (c) => {
        try {
          if (typeof c.isActive === "function" && c.isActive())
            active.push(c.key);
        } catch {
          // ignore
        }
      },
    );
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
      <div className="border-input flex flex-row flex-wrap justify-center gap-2 rounded-t-xl border border-b-0 bg-transparent p-2">
        <ToggleGroup
          className="border-border/50 border shadow"
          type="multiple"
          size="sm"
          value={activeToggles}
        >
          {controls.map(({ key, aria, run, Icon }) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={aria}
              onClick={run}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          className="border-border/50 border shadow"
          type="multiple"
          size="sm"
          value={activeToggles}
        >
          {blockControls.map(({ key, aria, run, Icon }) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={aria}
              onClick={run}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          className="border-border/50 border shadow"
          type="multiple"
          size="sm"
          value={activeToggles}
        >
          {listControls.map(({ key, aria, run, Icon }) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={aria}
              onClick={run}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          className="border-border/50 border shadow"
          type="multiple"
          size="sm"
          value={activeToggles}
        >
          {miscControls.map(({ key, aria, run, Icon }) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={aria}
              onClick={run}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </>
  );
};

export interface RichTextEditorProps {
  value: JSONContent | null;
  onChange: (content: JSONContent | null) => void;
  className?: string;
  editorClassName?: string;
  placeholder?: string;
  getLinkPreview?: (url: string) => void;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  getLinkPreview,
  className,
  editorClassName,
}: RichTextEditorProps) => {
  const extensions = getRichTextEditorExtensions(placeholder, getLinkPreview);

  const editor = useEditor({
    extensions: extensions,
    immediatelyRender: false,
    content: value !== null ? value : undefined,
    editorProps: {
      attributes: {
        class: "tiptap" + " " + editorClassName,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className={cn("flex flex-col", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
