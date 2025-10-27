// components/ui/rich-text-editor/SuggestionList.tsx
"use client";

import React, { useEffect, useImperativeHandle, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { MAX_CHARS_FOR_SEARCHING } from "@tera/config";

import { LoadingIndicator } from "~/components/LoadingIndicator";
import UserAvatar from "~/components/reuseables/UserAvatar";
import { useTRPC } from "~/trpc/react";

export type SuggestionItem = {
  id: string;
  label: string;
  name?: string;
  image?: string | null;
  usageCount?: number;
  isNew?: boolean;
};
export type SuggestionListProps = {
  command: (item: SuggestionItem) => void;
  query: string;
  suggestionType: "user" | "hashtag";
};
export type SuggestionListRef = {
  onKeyDown: ({ event }: { event: React.KeyboardEvent }) => boolean;
};

export const SuggestionList = ({
  ref,
  ...props
}: SuggestionListProps & {
  ref?: React.RefObject<SuggestionListRef | null>;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const trpc = useTRPC();

  // Fetch users for mentions
  const { data: users, isLoading: usersLoading } = useQuery(
    trpc.user.getForMention.queryOptions(
      { query: debouncedQuery, limit: 10 },
      {
        enabled:
          props.suggestionType === "user" &&
          debouncedQuery.length >= MAX_CHARS_FOR_SEARCHING,
        retry: 1,
        retryDelay: 1000,
      },
    ),
  );

  // Fetch hashtags for hashtag mentions
  const { data: hashtags, isLoading: hashtagsLoading } = useQuery(
    trpc.hashtag.getPopular.queryOptions(
      { query: debouncedQuery, limit: 10 },
      {
        enabled:
          props.suggestionType === "hashtag" &&
          debouncedQuery.length >= MAX_CHARS_FOR_SEARCHING,
      },
    ),
  );

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(props.query);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [props.query]); // This effect runs every time the input value changes

  // Update items based on fetched data
  useEffect(() => {
    if (props.suggestionType === "user") {
      setIsLoading(usersLoading);
      if (users) {
        const userItems: SuggestionItem[] = users.map((user) => ({
          id: user.id,
          label: user.name,
          name: user.name,
          image: user.image,
        }));
        setItems(userItems);
      } else if (!usersLoading) {
        setItems([]);
      }
    } else if (props.suggestionType === "hashtag") {
      setIsLoading(hashtagsLoading);
      const suggestions: SuggestionItem[] = [];

      // Add existing hashtags from database first
      const existingHashtags: SuggestionItem[] = [];
      if (hashtags) {
        hashtags.forEach((tag) => {
          existingHashtags.push({
            id: tag.id,
            label: tag.tag,
            usageCount: tag.usageCount,
            isNew: false,
          });
        });
      }

      // Check if the current query exactly matches any existing hashtag (case-insensitive)
      const exactMatch = existingHashtags.find(
        (tag) =>
          tag.label.toLowerCase().trim() ===
          debouncedQuery.toLowerCase().trim(),
      );

      // Only add the "New" option if no exact match exists and query is valid
      if (
        !exactMatch &&
        debouncedQuery.trim() &&
        !debouncedQuery.includes(" ")
      ) {
        suggestions.push({
          id: debouncedQuery,
          label: debouncedQuery,
          isNew: true,
        });
      }

      // Add all existing hashtags
      suggestions.push(...existingHashtags);

      setItems(suggestions);
    }
  }, [
    users,
    hashtags,
    usersLoading,
    hashtagsLoading,
    props.suggestionType,
    debouncedQuery,
  ]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) {
          props.command(item);
        }
        return true;
      }
      return false;
    },
  }));

  if (props.query.length < MAX_CHARS_FOR_SEARCHING) {
    return (
      <div className="bg-popover text-popover-foreground pointer-events-auto relative z-50 min-w-[156px] rounded-xl border p-2 text-center text-sm shadow-md">
        at least {MAX_CHARS_FOR_SEARCHING - props.query.length} <br />{" "}
        characters needed
      </div>
    );
  }

  // Show loading state when fetching suggestions
  if (isLoading) {
    return (
      <div className="bg-popover text-popover-foreground pointer-events-auto relative z-50 min-w-[156px] rounded-xl border p-4 shadow-md">
        <div className="flex items-center justify-center gap-2">
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-popover text-popover-foreground pointer-events-auto relative z-50 min-w-[200px] rounded-xl border p-1 shadow-md">
      {items.map((item, index) => (
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm ${index === selectedIndex ? "bg-accent text-accent-foreground" : ""}`}
          key={item.id}
          onClick={() => {
            const item = items[index];
            if (item) {
              props.command(item);
            }
          }}
        >
          {item.image !== undefined ? (
            <UserAvatar
              size={8}
              pending={false}
              user={{
                name: item.name || item.label,
                image: item.image,
              }}
            />
          ) : (
            <span className="bg-secondary/20 text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
              #
            </span>
          )}
          <div className="flex flex-1 flex-col">
            <span className="font-medium">{item.label}</span>
            {item.usageCount !== undefined && (
              <span className="text-muted-foreground text-xs">
                {item.usageCount} uses
              </span>
            )}
          </div>
          {item.isNew && (
            <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium">
              New
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
SuggestionList.displayName = "SuggestionList";
