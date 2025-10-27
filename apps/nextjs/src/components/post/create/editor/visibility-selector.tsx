"use client";

import { useValue } from "@legendapp/state/react";

import { postInfo } from "@tera/config";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { postEditorStore$ } from "~/stores/post-editor-store";

const VisibilitySelector = () => {
  const visibilityId = useValue(postEditorStore$.visibilityId);
  const { POST_VISIBILITY_CONFIG } = postInfo;

  const selectedOption = POST_VISIBILITY_CONFIG.find(
    (v) => v.id === visibilityId,
  );

  return (
    <Select
      value={visibilityId}
      onValueChange={(value) => postEditorStore$.visibilityId.set(value)}
    >
      <SelectTrigger className="bg-muted/60 hover:bg-muted h-auto w-fit border-none px-2 py-1 text-xs font-semibold shadow-none transition-colors focus:ring-0 focus:ring-offset-0">
        <SelectValue asChild>
          <div className="flex items-center gap-1.5">
            {selectedOption && <selectedOption.icon className="h-3.5 w-3.5" />}
            <span>{selectedOption?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {POST_VISIBILITY_CONFIG.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <div className="flex items-start gap-3 py-1">
              <option.icon className="mt-0.5 h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-medium">{option.name}</span>
                <span className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VisibilitySelector;
