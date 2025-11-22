import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { genUploader } from "uploadthing/client";

import { OurFileRouter } from "./uploadthing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const { uploadFiles } = genUploader<OurFileRouter>();
