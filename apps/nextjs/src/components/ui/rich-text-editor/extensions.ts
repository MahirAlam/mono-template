"use client";

import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";

import StarterKit from "@tiptap/starter-kit";
import { hashtagSuggestion, userSuggestion } from "./suggestion";

export const getRichTextEditorExtensions = (
  placeholder: string = "What's on your mind?",
  getLinkPreview?: (url: string) => void,
) => [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    link: {
      autolink: true,
      linkOnPaste: true,
      openOnClick: false,
      defaultProtocol: "https",
      protocols: ["http", "https"],
      isAllowedUri: (url, ctx) => {
        try {
          // construct URL
          const parsedUrl = url.includes(":")
            ? new URL(url)
            : new URL(`${ctx.defaultProtocol}://${url}`);

          // use default validation
          if (!ctx.defaultValidate(parsedUrl.href)) {
            return false;
          }

          // disallowed protocols
          const disallowedProtocols = ["ftp", "file", "mailto"];
          const protocol = parsedUrl.protocol.replace(":", "");

          if (disallowedProtocols.includes(protocol)) {
            return false;
          }

          // only allow protocols specified in ctx.protocols
          const allowedProtocols = ctx.protocols.map((p) =>
            typeof p === "string" ? p : p.scheme,
          );

          if (!allowedProtocols.includes(protocol)) {
            return false;
          }

          // disallowed domains
          const disallowedDomains = [
            "example-phishing.com",
            "malicious-site.net",
          ];
          const domain = parsedUrl.hostname;

          if (disallowedDomains.includes(domain)) {
            return false;
          }

          getLinkPreview && getLinkPreview(parsedUrl.href);

          // all checks have passed
          return true;
        } catch {
          return false;
        }
      },
      shouldAutoLink: (url) => {
        try {
          // construct URL
          const parsedUrl = url.includes(":")
            ? new URL(url)
            : new URL(`https://${url}`);

          // only auto-link if the domain is not in the disallowed list
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
  Mention.extend({
    name: "hashtagMention",
  }).configure({
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
