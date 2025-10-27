import type { JSONContent } from "@tiptap/react";

/**
 * Traverses a TipTap JSON content object and extracts all mention nodes.
 * @param content The TipTap JSONContent object.
 * @returns An array of unique mentioned user IDs.
 */
export const extractMentions = (content: JSONContent): string[] => {
  const userIds = new Set<string>();

  function traverse(node: JSONContent) {
    // Check for user mentions - regular mention nodes that are not hashtags
    if (
      node.type === "mention" &&
      node.attrs &&
      typeof (node.attrs as any).id === "string" &&
      typeof (node.attrs as any).label === "string" &&
      // Ensure this is a user mention (not hashtag) by checking the rendered label doesn't start with #
      !(node.attrs as any).label.startsWith("#")
    ) {
      userIds.add((node.attrs as any).id);
    }

    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return Array.from(userIds);
};

/**
 * Traverses a TipTap JSON content object and extracts all hashtag nodes.
 * @param content The TipTap JSONContent object.
 * @returns An array of unique hashtag texts (without the '#').
 */
export const extractHashtags = (content: JSONContent): string[] => {
  const hashtags = new Set<string>();

  function traverse(node: JSONContent) {
    // Check for hashtag mentions using the extended mention type
    if (
      node.type === "hashtagMention" &&
      node.attrs &&
      typeof (node.attrs as any).label === "string"
    ) {
      hashtags.add((node.attrs as any).label);
    }

    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return Array.from(hashtags);
};

/**
 * Converts TipTap JSON to plain text for summaries, notifications, etc.
 * @param content The TipTap JSONContent object.
 * @returns A plain text representation.
 */
export const jsonToText = (content: JSONContent): string => {
  let text = "";

  function traverse(node: JSONContent) {
    if (node.text) {
      text += node.text;
    }
    // Handle mention nodes (user mentions)
    if (node.type === "mention" && node.attrs) {
      text += `@${(node.attrs as any).label || (node.attrs as any).id}`;
    }
    // Handle hashtag mention nodes
    if (node.type === "hashtagMention" && node.attrs) {
      text += `#${(node.attrs as any).label || (node.attrs as any).id}`;
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return text;
};

/**
 * Extracts the first URL found in the text content of the editor JSON.
 * @param content The TipTap JSONContent object.
 * @returns The first URL string found, or null if none.
 */
export const extractFirstUrl = (content: JSONContent): string | null => {
    const text = jsonToText(content);
    const urlRegex = /(https?:\/\/\S+)/;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
}