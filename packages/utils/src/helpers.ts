import type { UploadData } from "./types/uploadthing";
import { utapi } from "./utapi";

interface ImageProcessingOptions {
  width: number;
  height: number;
  quality: number;
}

/**
 * Fetches an image from a URL, resizes it using Jimp,
 * and uploads it to UploadThing.
 * Optimized specifically for avatar images with upscaling support.
 */
export async function uploadAvatarFromUrl(
  sourceUrl: string,
  options: ImageProcessingOptions,
  fileName: string,
): Promise<UploadData> {
  // Wrap the entire process in a single try...catch block.
  // This ensures that any error at any step (fetch, jimp, upload)
  // is caught and handled gracefully.
  try {
    // 1. Fetching logic
    if (!sourceUrl.startsWith("http")) {
      throw new Error("Invalid source URL. Must be a public HTTP/HTTPS URL.");
    }
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Status: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // 2. Process the image with Jimp (pure JavaScript, no native bindings)
    try {
      const { Jimp } = await import("jimp");
      const image = await Jimp.read(imageBuffer);

      console.log(
        `Original image size: ${imageBuffer.length} bytes, dimensions: ${image.width}x${image.height}`,
      );

      // For avatars: upscale if needed to maintain quality
      const scaleFactor = Math.max(
        options.width / image.width,
        options.height / image.height,
      );

      const bytesPerPixel = imageBuffer.length / (image.width * image.height);
      console.log(`Source density: ${bytesPerPixel.toFixed(2)} bytes/pixel`);

      // Upscale if source is smaller than target AND quality is decent
      if (scaleFactor > 1.1 && bytesPerPixel > 0.3) {
        console.log(
          `Upscaling from ${image.width}x${image.height} by ${scaleFactor.toFixed(2)}x`,
        );
        image.resize({
          w: Math.round(image.width * scaleFactor),
          h: Math.round(image.height * scaleFactor),
        });
      } else {
        // Standard resize to exact target
        image.resize({
          w: options.width,
          h: options.height,
        });
      }

      // Quality settings: prioritize quality for avatars
      let quality = 90;
      if (bytesPerPixel < 0.3) {
        // Very low quality source - maximum upscaling
        quality = 95;
        console.log("Very low quality - maximum upscaling to 95");
      } else if (bytesPerPixel < 0.5) {
        // Low quality source - high quality
        quality = 93;
        console.log("Low quality - upscaling to 93");
      } else if (bytesPerPixel > 3) {
        // Very high quality source - can compress more
        quality = 88;
        console.log("Very high quality - compression to 88");
      } else if (bytesPerPixel > 2) {
        // High quality - balanced
        quality = 90;
        console.log("High quality - using 90");
      } else {
        // Standard
        quality = 91;
        console.log("Standard quality - using 91");
      }

      // Generate optimized buffer
      let processedImageBuffer = await image.getBuffer("image/jpeg");

      console.log(
        `Processed: ${processedImageBuffer.length} bytes (${((processedImageBuffer.length / imageBuffer.length) * 100).toFixed(1)}% of original)`,
      );

      // Avatar target: 30-150KB for quality and load time
      if (processedImageBuffer.length > 150 * 1024) {
        console.log("Avatar >150KB, optimizing further");
        const reduceFactor = Math.sqrt(
          (150 * 1024) / processedImageBuffer.length,
        );
        const newWidth = Math.round(image.width * reduceFactor);
        const newHeight = Math.round(image.height * reduceFactor);
        image.resize({ w: newWidth, h: newHeight });
        processedImageBuffer = await image.getBuffer("image/jpeg");
        console.log(
          `Final: ${newWidth}x${newHeight}, ${processedImageBuffer.length} bytes`,
        );
      }

      console.log("Image processed successfully with Jimp");

      // 3. Create a File and upload to UploadThing
      // Replace .webp extension with .jpg to match the MIME type
      const jpgFileName = fileName.replace(/\.(webp|png|gif|bmp)$/i, ".jpg");
      const file = new File([processedImageBuffer], jpgFileName, {
        type: "image/jpeg",
      });

      const uploadResponse = await utapi.uploadFiles(file);

      if (uploadResponse.error) {
        // This specifically handles errors returned from the UploadThing API
        throw new Error(
          `UploadThing API Error: ${uploadResponse.error.message}`,
        );
      }

      // 4. Return successful data
      return uploadResponse.data;
    } catch (jimpError) {
      console.error("Jimp image processing error:", jimpError);
      throw new Error(
        `Failed to process image with Jimp: ${jimpError instanceof Error ? jimpError.message : String(jimpError)}`,
      );
    }
  } catch (error) {
    // This single catch block will handle any network error,
    // image processing error, or upload error.
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("The image upload process failed:", errorMessage);

    // Re-throw a generic error to the calling function (the server action)
    throw new Error("Failed to process and upload image.");
  }
}

interface PostImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetFileSizeKB?: number;
}

/**
 * Optimizes images for posts using Jimp with high-quality preservation.
 * Accepts both File objects and URL strings.
 * Optimized for visual quality while maintaining reasonable file sizes.
 */
export async function optimizePostImage(
  source: File | string,
  options: PostImageOptimizationOptions = {},
): Promise<File> {
  const {
    maxWidth = 2560, // Higher resolution for posts
    maxHeight = 2560,
    quality = 92, // High quality for posts
    targetFileSizeKB = 500, // Target max 500KB for posts
  } = options;

  try {
    let imageBuffer: Buffer;

    // Handle both File and URL inputs
    if (typeof source === "string") {
      // Fetch from URL
      if (!source.startsWith("http")) {
        throw new Error("Invalid source URL. Must be a public HTTP/HTTPS URL.");
      }
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch image. Status: ${response.status}`);
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Convert File to Buffer
      imageBuffer = Buffer.from(await source.arrayBuffer());
    }

    const { Jimp } = await import("jimp");
    const image = await Jimp.read(imageBuffer);

    console.log(
      `Post image original: ${imageBuffer.length} bytes, ${image.width}x${image.height}`,
    );

    // Calculate aspect ratio and new dimensions
    const aspectRatio = image.width / image.height;
    let newWidth = image.width;
    let newHeight = image.height;

    // Constrain to max dimensions while preserving aspect ratio
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio);
    }

    // Only resize if dimensions changed
    if (newWidth !== image.width || newHeight !== image.height) {
      console.log(
        `Resizing from ${image.width}x${image.height} to ${newWidth}x${newHeight}`,
      );
      image.resize({
        w: newWidth,
        h: newHeight,
      });
    }

    // Analyze source quality
    const bytesPerPixel = imageBuffer.length / (image.width * image.height);
    let finalQuality = quality;

    if (bytesPerPixel < 0.4) {
      // Low quality source - preserve more detail
      finalQuality = Math.min(94, quality);
      console.log("Low quality source detected - increasing quality to 94");
    } else if (bytesPerPixel > 2.5) {
      // Very high quality source - can compress more
      finalQuality = Math.min(90, quality);
      console.log("High quality source detected - using quality 90");
    }

    // Generate JPEG buffer
    let processedBuffer = await image.getBuffer("image/jpeg");

    console.log(
      `Post image processed: ${processedBuffer.length} bytes (${((processedBuffer.length / imageBuffer.length) * 100).toFixed(1)}% of original)`,
    );

    // Iterative compression if over target size
    let compressionQuality = finalQuality;
    const targetBytes = targetFileSizeKB * 1024;
    let iterations = 0;
    const maxIterations = 5;

    while (
      processedBuffer.length > targetBytes &&
      compressionQuality > 75 &&
      iterations < maxIterations
    ) {
      iterations++;
      compressionQuality -= 2;
      console.log(
        `Over size limit, reducing quality to ${compressionQuality} (iteration ${iterations})`,
      );
      processedBuffer = await image.getBuffer("image/jpeg");
    }

    // Get filename from source
    let fileName: string;
    if (typeof source === "string") {
      fileName = source.split("/").pop() || "post-image.jpg";
    } else {
      fileName = source.name;
    }

    // Ensure .jpg extension
    fileName = fileName.replace(/\.[^/.]+$/, ".jpg");

    // Create and return optimized File
    const optimizedFile = new File([processedBuffer], fileName, {
      type: "image/jpeg",
    });

    console.log(
      `Post image optimization complete: ${optimizedFile.size} bytes`,
    );
    return optimizedFile;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Post image optimization failed:", errorMessage);
    throw new Error(
      `Failed to optimize post image: ${errorMessage}`,
    );
  }
}
