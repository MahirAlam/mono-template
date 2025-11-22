"use client";

import { useState } from "react";
import Image from "next/image";
import { useValue } from "@legendapp/state/react";
import { Check, Edit } from "lucide-react";

import { postInfo } from "@tera/config";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { postEditorStore$ } from "~/stores/post-editor-store";

const DUMMY_FRIENDS = [
  {
    id: "u_10001",
    name: "Ava Thompson",
    username: "ava",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10002",
    name: "Liam Walker",
    username: "liam",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10003",
    name: "Maya Patel",
    username: "maya",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10004",
    name: "Noah Reynolds",
    username: "noah",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10005",
    name: "Zoe Carter",
    username: "zoe",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10006",
    name: "Ethan Brooks",
    username: "ethan",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10007",
    name: "Lila Martínez",
    username: "lila",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10008",
    name: "Kai Nakamura",
    username: "kai",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10009",
    name: "Nora Singh",
    username: "nora",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10010",
    name: "Owen García",
    username: "owen",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10011",
    name: "Ivy Chen",
    username: "ivy",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10012",
    name: "Mason O'Neil",
    username: "mason",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
  {
    id: "u_10013",
    name: "Sofia Rossi",
    username: "sofia",
    image:
      "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
  },
];

const VisibilitySelector = () => {
  const visibilityId = useValue(postEditorStore$.visibilityId);
  const visibilityFilterVal = useValue(postEditorStore$.visibilityFilter);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempVisibilityId, setTempVisibilityId] =
    useState<string>(visibilityId);
  const [selectedIds, setSelectedIds] = useState<string[]>(visibilityFilterVal);

  const { POST_VISIBILITY_CONFIG } = postInfo;

  const selectedOption = POST_VISIBILITY_CONFIG.find(
    (v) => v.id === tempVisibilityId,
  );

  const handleOpenDialog = () => {
    if (selectedOption && Array.isArray(selectedOption.filter)) {
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-row gap-1">
      <Select
        value={tempVisibilityId}
        onValueChange={(value) => {
          const selected = POST_VISIBILITY_CONFIG.find((v) => v.id === value);
          setTempVisibilityId(value);
          setSelectedIds([]);

          // If the option's filter is an array it requires a selection popup
          if (Array.isArray(selected?.filter)) {
            setDialogOpen(true);
          } else {
            postEditorStore$.visibilityFilter.set([selected?.filter ?? ""]);
            postEditorStore$.visibilityId.set(value);
          }
        }}
      >
        <SelectTrigger
          className="bg-muted/60 hover:bg-muted h-8! w-fit border-none px-2 py-0 text-xs font-semibold shadow-none transition-colors focus:ring-0 focus:ring-offset-0"
          onClick={handleOpenDialog}
        >
          <SelectValue asChild>
            <div className="flex items-center gap-1.5">
              {selectedOption && (
                <selectedOption.icon className="h-3.5 w-3.5" />
              )}
              <span>
                {selectedOption?.name}
                {selectedOption?.requiresFriendSelector
                  ? ` (${selectedIds.length > 0 ? selectedIds.length - 1 : 0})`
                  : null}
              </span>
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

      {/* Inline edit button to open dialog even when the same select value is clicked */}
      {selectedOption && Array.isArray(selectedOption.filter) && (
        <Button
          variant="ghost"
          className="h-8! p-2"
          onClick={() => {
            setTempVisibilityId(visibilityId);
            setSelectedIds(
              Array.isArray(visibilityFilterVal) ? visibilityFilterVal : [],
            );
            setDialogOpen(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {/* Selection dialog for friend/list-based visibility options */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            postEditorStore$.visibilityId.set(tempVisibilityId);
            postEditorStore$.visibilityFilter.set(selectedIds);
            setDialogOpen(false);
          }
        }}
      >
        <DialogOverlay />
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-foreground">
              {selectedOption?.name ?? "Select"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedOption?.requiresFriendSelector
                ? selectedOption.id === "1f9d6c3a-8b1e-4f3e-9e7b-9f6e1a3b2c5d"
                  ? "Select friends to exclude"
                  : "Select friends to include"
                : "Choose items"}
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <Separator className="bg-accent/50 h-px shadow" />

          <div className="px-6 py-3">
            <Command className="rounded-lg bg-transparent md:min-w-sm">
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {DUMMY_FRIENDS.map((f) => {
                    const uniqueId = `${f.name} (${f.username ? f.username : ""})`;

                    return (
                      <CommandItem
                        key={f.id}
                        value={uniqueId}
                        onSelect={(currentValue) => {
                          setSelectedIds((value) =>
                            value.includes(currentValue)
                              ? value.filter((v) => v !== currentValue)
                              : [...value, currentValue],
                          );
                        }}
                        className={cn("my-1 h-10 rounded-lg", {
                          "bg-accent/40": selectedIds.includes(uniqueId),
                        })}
                      >
                        <Image
                          src={f.image}
                          alt={f.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        {f.name}
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedIds.includes(uniqueId)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          <Separator className="bg-accent/50 h-px shadow" />
          <DialogFooter className="flex justify-end gap-2 p-4">
            <Button
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                setSelectedIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // save selection into the store
                postEditorStore$.visibilityId.set(tempVisibilityId);
                postEditorStore$.visibilityFilter.set(selectedIds);
                setDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisibilitySelector;
