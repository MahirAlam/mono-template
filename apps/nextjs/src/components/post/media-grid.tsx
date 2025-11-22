import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film, Move, X } from "lucide-react";

import type { DbLinkPreview, DbMediaItem } from "@tera/utils/types";

import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { StagedMediaItem } from "~/stores/post-editor-store";

// Union type for all media items used by the UI
export type MediaItem = StagedMediaItem | DbMediaItem;

type MediaGridProps = {
  items: MediaItem[];
  linkPreview?: DbLinkPreview | null;
  onRemove?: (url: string) => void;
  onReorderAction?: (reorderedItems: StagedMediaItem[]) => void;
  enableReordering: boolean;
};

// Type guard to check if item is StagedMediaItem
const isStagedMediaItem = (
  item: MediaItem | NonNullable<DbLinkPreview>,
): item is StagedMediaItem => {
  return "status" in item && "progress" in item;
};

const isStagedLink = (item: MediaItem): item is StagedMediaItem => {
  return isStagedMediaItem(item) && item.type === "link";
};

// Helper functions to get media properties
const getMediaUrl = (item: MediaItem): string => {
  if (isStagedMediaItem(item)) {
    return item.type === "link" ? item.previewUrl || item.url : item.url;
  }
  return item.url;
};

const getMediaAlt = (item: MediaItem): string => {
  if (isStagedMediaItem(item)) {
    return item.title || "Media preview";
  }
  return item.altText || "Media preview";
};
// Sortable Media Item Component
const SortableMediaItem = ({
  item,
  onRemove,
}: {
  item: StagedMediaItem;
  onRemove?: (url: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab active:cursor-grabbing",
        isDragging && "z-50 opacity-50",
      )}
      {...attributes}
      {...listeners}
    >
      <Card className="hover:border-primary/20 overflow-hidden border-2 border-dashed border-transparent p-0 transition-all hover:scale-105">
        <div className="relative">
          <AspectRatio ratio={1} className="bg-muted">
            <img
              src={getMediaUrl(item)}
              alt={getMediaAlt(item)}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Film className="h-8 w-8 text-white" />
              </div>
            )}
          </AspectRatio>

          {/* Drag handle */}
          <div className="bg-background/80 absolute top-2 left-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Move className="text-muted-foreground h-4 w-4" />
          </div>

          {/* Remove button */}
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.url);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

// Static Media Item (for database items)
const StaticMediaItem = ({ item }: { item: MediaItem }) => (
  <Card className="overflow-hidden border-0 p-0">
    <AspectRatio ratio={1} className="bg-muted">
      <img
        src={getMediaUrl(item)}
        alt={getMediaAlt(item)}
        className="h-full w-full object-cover"
      />
      {item.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Film className="h-8 w-8 text-white" />
        </div>
      )}
    </AspectRatio>
  </Card>
);

// Link Preview Component
const LinkPreview = ({
  linkItem,
  onRemove,
}: {
  linkItem: StagedMediaItem | DbLinkPreview | null;
  onRemove?: (url: string) => void;
}) => {
  if (!linkItem) return null;

  const imageUrl = isStagedMediaItem(linkItem)
    ? linkItem.previewUrl
    : linkItem.imageUrl;
  const isStaged = isStagedMediaItem(linkItem);

  return (
    <Card className="group relative overflow-hidden p-0">
      <a
        href={linkItem.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-accent/5 block transition-colors"
      >
        {imageUrl && (
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src={imageUrl}
              alt={linkItem.title || ""}
              className="h-full w-full object-cover"
            />
          </AspectRatio>
        )}
        <div className="p-3">
          <p className="text-muted-foreground text-xs uppercase">
            {new URL(linkItem.url).hostname}
          </p>
          {linkItem.title && (
            <p className="text-foreground truncate font-semibold">
              {linkItem.title}
            </p>
          )}
          {linkItem.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {linkItem.description}
            </p>
          )}
        </div>
      </a>
      {onRemove && isStaged && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(linkItem.url);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Card>
  );
};

export const MediaGrid = ({
  items,
  linkPreview,
  onRemove,
  onReorderAction,
  enableReordering = false,
}: MediaGridProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Separate staged media items for reordering
  const StagedMediaItems = items
    .filter(isStagedMediaItem)
    .filter((item) => item.type !== "link");
  const stagedLinkItem = items.find(isStagedLink);
  const dbMediaItems = items.filter((item) => !isStagedMediaItem(item));

  // Use either staged link or database link preview
  const linkItem = stagedLinkItem || linkPreview;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = StagedMediaItems.findIndex(
          (item) => item.url === active.id,
        );
        const newIndex = StagedMediaItems.findIndex(
          (item) => item.url === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(StagedMediaItems, oldIndex, newIndex);
          if (onReorderAction) {
            onReorderAction(newItems);
          }
        }
      }

      setActiveId(null);
    },
    [StagedMediaItems, onReorderAction],
  );

  if (items.length === 0 && !linkPreview) return null;

  const activeItem = activeId
    ? StagedMediaItems.find((item) => item.url === activeId)
    : null;
  const hasMedia = StagedMediaItems.length > 0 || dbMediaItems.length > 0;

  return (
    <div className="space-y-3">
      {/* Link preview at the beginning */}
      {linkItem && linkItem.position === "first" && (
        <LinkPreview linkItem={linkItem} onRemove={onRemove} />
      )}

      {/* Media grid */}
      {hasMedia && (
        <div className="grid grid-cols-2 gap-3">
          {/* Static database media items */}
          {dbMediaItems.map((item) => (
            <StaticMediaItem key={item.url} item={item} />
          ))}

          {/* Sortable staged media items */}
          {enableReordering && StagedMediaItems.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => setActiveId(event.active.id as string)}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={StagedMediaItems.map((item) => item.url)}
                strategy={rectSortingStrategy}
              >
                {StagedMediaItems.map((item) => (
                  <SortableMediaItem
                    key={item.url}
                    item={item}
                    onRemove={onRemove}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeItem && (
                  <Card className="overflow-hidden p-0 opacity-90">
                    <AspectRatio ratio={1} className="bg-muted">
                      <img
                        src={getMediaUrl(activeItem)}
                        alt={getMediaAlt(activeItem)}
                        className="h-full w-full object-cover"
                      />
                      {activeItem.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Film className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </AspectRatio>
                  </Card>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            // Static staged media items when reordering is disabled
            StagedMediaItems.map((item) => (
              <div key={item.url} className="group relative">
                <Card className="overflow-hidden p-0">
                  <AspectRatio ratio={1} className="bg-muted">
                    <img
                      src={getMediaUrl(item)}
                      alt={getMediaAlt(item)}
                      className="h-full w-full object-cover"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </AspectRatio>
                </Card>
                {onRemove && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onRemove(item.url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Link preview at the end */}
      {linkItem && linkItem.position === "last" && (
        <LinkPreview linkItem={linkItem} onRemove={onRemove} />
      )}
    </div>
  );
};
