"use client";

import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

import { hashtagSuggestion, userSuggestion } from "./suggestion";

/**
 * Social-media-focused Tiptap extensions
 * - Headings are disabled (not typical for short social posts)
 * - Keep inline code, code blocks, blockquote, lists, link, underline, bold, italic, strike
 * - Add dropcursor/gapcursor for improved editing UX
 */
export const getRichTextEditorExtensions = (
  placeholder = "What's on your mind?",
  getLinkPreview?: (url: string) => void,
) => [
  StarterKit.configure({
    // disable headings for social posts; keep code, lists, blockquote, etc.
    heading: false,
    horizontalRule: false,
    code: false,
    hardBreak: false,
    dropcursor: false,
    gapcursor: false,
    listKeymap: false,
    // keep codeBlock, blockquote, lists, hardBreak etc in defaults
    // marks (bold/italic/strike/code/link/underline) remain enabled
    link: {
      autolink: true,
      linkOnPaste: true,
      openOnClick: false,
      defaultProtocol: "https",
      protocols: ["http", "https"],
      isAllowedUri: (url, ctx) => {
        try {
          const parsedUrl = url.includes(":")
            ? new URL(url)
            : new URL(`${ctx.defaultProtocol}://${url}`);

          if (!ctx.defaultValidate(parsedUrl.href)) return false;

          const disallowedProtocols = ["ftp", "file", "mailto"];
          const protocol = parsedUrl.protocol.replace(":", "");
          if (disallowedProtocols.includes(protocol)) return false;

          const allowedProtocols = ctx.protocols.map((p) =>
            typeof p === "string" ? p : p.scheme,
          );
          if (!allowedProtocols.includes(protocol)) return false;

          const disallowedDomains = [
            "example-phishing.com",
            "malicious-site.net",
          ];
          const domain = parsedUrl.hostname;
          if (disallowedDomains.includes(domain)) return false;

          getLinkPreview?.(parsedUrl.href);
          return true;
        } catch {
          return false;
        }
      },
      shouldAutoLink: (url) => {
        try {
          const parsedUrl = url.includes(":")
            ? new URL(url)
            : new URL(`https://${url}`);
          const disallowedDomains = [
            "example-no-autolink.com",
            "another-no-autolink.com",
          ];
          const domain = parsedUrl.hostname;
          return !disallowedDomains.includes(domain);
        } catch {
          return false;
        }
      },
    },
  }),

  Placeholder.configure({
    placeholder: placeholder || "What's on your mind?",
  }),

  // mention for users
  Mention.configure({
    HTMLAttributes: {
      class: "mention-user",
      "data-type": "mention",
    },
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id}`;
    },
    suggestion: userSuggestion,
  }),

  // hashtag mentions (prefixed with #)
  Mention.extend({ name: "hashtagMention" }).configure({
    HTMLAttributes: {
      class: "mention-hashtag",
      "data-type": "hashtag",
    },
    renderText({ node }) {
      return `#${node.attrs.label ?? node.attrs.id}`;
    },
    suggestion: {
      ...hashtagSuggestion,
      char: "#",
    },
  }),
];
