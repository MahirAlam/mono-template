import { formatDistanceToNow } from "date-fns";

import { env } from "~/env";

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return `http://localhost:3000`;
};

export const getTimeAgo = (data: Date): string => {
  const date = formatDistanceToNow(new Date(data), {
    addSuffix: true,
  });

  return date;
};
