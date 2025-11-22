// lib/media-optimizer.ts
import { v4 as uuidv4 } from "uuid";

export type OptimizationOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png"; // Removed webp - better compatibility with jpeg for quality
  targetFileSizeKB?: number; // Optional: target file size for smart compression
};

const DEFAULT_OPTIONS: OptimizationOptions = {
  maxWidth: 2560, // Higher for post images (high quality)
  maxHeight: 2560,
  quality: 0.92, // High quality (92%) for posts
  format: "jpeg",
  targetFileSizeKB: 500, // Smart compression target
};

/**
 * Analyzes image quality by examining pixel data
 * Returns a score from 0-1 based on color variation and detail
 */
function analyzeImageQuality(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): number {
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let colorVariance = 0;
    let sampleSize = Math.min(1000, Math.floor(data.length / 4)); // Sample pixels

    for (let i = 0; i < sampleSize; i++) {
      const idx = Math.floor(Math.random() * Math.floor(data.length / 4)) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      // Measure color variation
      colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
    }

    const avgVariance = colorVariance / sampleSize / 765; // Normalize to 0-1
    return Math.min(1, avgVariance);
  } catch {
    return 0.5; // Default if analysis fails
  }
}

/**
 * Optimizes images for posts with high-quality preservation
 * Uses intelligent quality detection and iterative compression
 */
export async function optimizeImage(
  file: File,
  options: OptimizationOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;
        const aspectRatio = width / height;

        if (width > opts.maxWidth!) {
          width = opts.maxWidth!;
          height = width / aspectRatio;
        }

        if (height > opts.maxHeight!) {
          height = opts.maxHeight!;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Analyze quality from the drawn image
        const imageQualityScore = analyzeImageQuality(ctx, canvas);
        console.log(`Image quality score: ${imageQualityScore.toFixed(2)}`);

        // Adjust quality based on source quality
        let finalQuality = opts.quality!;
        if (imageQualityScore < 0.3) {
          // Low quality/low detail image - can compress more
          finalQuality = 0.85;
          console.log("Low quality image detected - using 85% quality");
        } else if (imageQualityScore < 0.5) {
          // Medium quality - slight compression
          finalQuality = Math.min(0.9, opts.quality!);
          console.log("Medium quality image detected - using 90% quality");
        } else if (imageQualityScore > 0.8) {
          // High quality/high detail - preserve more
          finalQuality = Math.max(0.92, opts.quality!);
          console.log("High quality image detected - using 92% quality");
        }

        // Iterative compression if over target size
        let currentQuality = finalQuality;
        let attempts = 0;
        const maxAttempts = 4;

        const compressWithQuality = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to optimize image"));
                return;
              }

              const blobSizeKB = blob.size / 1024;

              // If over target size and can reduce quality further, try again
              if (
                blobSizeKB > opts.targetFileSizeKB! &&
                currentQuality > 0.75 &&
                attempts < maxAttempts
              ) {
                attempts++;
                currentQuality -= 0.04; // Reduce by 4%
                console.log(
                  `Blob size ${blobSizeKB.toFixed(1)}KB > target, reducing quality to ${(currentQuality * 100).toFixed(0)}%`,
                );
                compressWithQuality(currentQuality);
                return;
              }

              console.log(
                `Final image: ${blobSizeKB.toFixed(1)}KB at ${(quality * 100).toFixed(0)}% quality`,
              );

              const extension = opts.format === "png" ? "png" : "jpg";
              const mimeType =
                opts.format === "png" ? "image/png" : "image/jpeg";

              // Use a UUID-based filename so the generated file can be used as a stable id
              const optimizedFileName = `${uuidv4()}.${extension}`;

              const optimizedFile = new File([blob], optimizedFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              resolve(optimizedFile);
            },
            `image/${opts.format}`,
            quality,
          );
        };

        console.log(
          `Resized from ${originalWidth}x${originalHeight} to ${Math.round(width)}x${Math.round(height)}`,
        );
        compressWithQuality(finalQuality);
      } catch (error) {
        reject(
          new Error(
            `Image processing error: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export async function optimizeVideo(file: File): Promise<File> {
  // For now we don't transcode client-side, but assign a UUID name so
  // the returned file can be used as a stable identifier in the DB.
  try {
    const parts = file.name.split(".");
    const ext = parts.length > 1 ? parts.pop() : "mp4";
    const newName = `${uuidv4()}.${ext}`;
    const newFile = new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified || Date.now(),
    });
    return newFile;
  } catch (e) {
    return file;
  }
}

export async function optimizeMedia(file: File): Promise<File> {
  if (file.type.startsWith("image/")) {
    try {
      return await optimizeImage(file);
    } catch (error) {
      console.warn("Image optimization failed, using original:", error);
      return file;
    }
  } else if (file.type.startsWith("video/")) {
    return await optimizeVideo(file);
  }

  return file;
}
