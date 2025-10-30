import { File } from "@web-std/file";
import sharp from "sharp";

import { utapi } from "./utapi";

// Define strict options for our image processing
interface ImageProcessingOptions {
  width: number;
  height: number;
  quality: number; // Quality for WebP, 1-100
}

/**
 * Fetches an image from a URL, optimizes it, and uploads it to UploadThing.
 *
 * This function is strict and will throw an error if any step fails.
 * - Validates the source URL.
 * - Fetches the image as a buffer.
 * - Resizes, converts to WebP, and optimizes using 'sharp'.
 * - Uploads the final buffer to UploadThing.
 *
 * @param sourceUrl - The public URL of the image to process.
 * @param options - The processing options (width, height, quality).
 * @param fileName - The desired name for the final uploaded file (e.g., `avatar.webp`).
 * @returns A promise that resolves with the successful upload response from UploadThing.
 * @throws An error if the URL is invalid, fetching fails, processing fails, or upload fails.
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  options: ImageProcessingOptions,
  fileName: string,
): ReturnType<typeof utapi.uploadFiles> {
  // 1. Validate the source URL
  if (!sourceUrl.startsWith("http")) {
    throw new Error("Invalid source URL. Must be a public HTTP/HTTPS URL.");
  }

  let imageBuffer: Buffer;
  try {
    // 2. Fetch the image
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error fetching image:", error);
    throw new Error("Could not retrieve the image from the provided URL.");
  }

  let processedImageBuffer: Buffer;
  try {
    // 3. Process the image with Sharp
    processedImageBuffer = await sharp(imageBuffer)
      .resize(options.width, options.height)
      .webp({ quality: options.quality })
      .toBuffer();
  } catch (error) {
    console.error("Error processing image with sharp:", error);
    throw new Error("Failed to optimize the image.");
  }

  try {
    // 4. Prepare the file for UploadThing
    const file = new File([processedImageBuffer], fileName, {
      type: "image/webp",
    });

    // 5. Upload the processed file
    const uploadResponse = await utapi.uploadFiles(file);

    return [uploadResponse];
  } catch (error) {
    console.error("Error uploading processed image:", error);
    throw new Error("Could not upload the final image.");
  }
}
