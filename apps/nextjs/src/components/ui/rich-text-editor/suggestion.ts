// components/ui/rich-text-editor/suggestion.ts
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";

import type { SuggestionListRef } from "./SuggestionList";
import { SuggestionList } from "./SuggestionList";

const createSuggestion = (type: "user" | "hashtag") => ({
  items: ({ query: _query }: { query: string }) => [],
  render: () => {
    let component: ReactRenderer<SuggestionListRef>;
    let popup: HTMLDivElement | null;
    let currentQuery = "";

    return {
      onStart: (props: SuggestionProps) => {
        currentQuery = props.query || "";
        component = new ReactRenderer(SuggestionList, {
          props: {
            command: props.command,
            query: currentQuery,
            suggestionType: type,
          },
          editor: props.editor,
        });
        popup = document.createElement("div");
        popup.style.position = "absolute";
        popup.appendChild(component.element);
        document.body.appendChild(popup);
        const rect = props.clientRect ? props.clientRect() : null;
        if (!rect) return;
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY}px`;
      },
      onUpdate(props: SuggestionProps) {
        currentQuery = props.query || "";
        component.updateProps({
          command: props.command,
          query: currentQuery,
          suggestionType: type,
        });
        const rect = props.clientRect ? props.clientRect() : null;
        if (!rect || !popup) return;
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY}px`;
      },
      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === "Escape") {
          popup?.remove();
          return true;
        }
        const syntheticEvent = {
          key: props.event.key,
          preventDefault: () => props.event.preventDefault(),
          stopPropagation: () => props.event.stopPropagation(),
        } as React.KeyboardEvent;
        return component.ref?.onKeyDown({ event: syntheticEvent }) ?? false;
      },
      onExit() {
        popup?.remove();
        component.destroy();
      },
    };
  },
});

export const userSuggestion = createSuggestion("user");
export const hashtagSuggestion = createSuggestion("hashtag");
