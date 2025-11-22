import { AlertCircle, UploadCloud, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { MAX_MEDIA_ITEMS } from "@tera/config";

import { cn } from "~/lib/utils";
import { StagedMediaItem } from "~/stores/post-editor-store";

const DragOverlay = ({
  message,
  description,
  Icon,
  classNames = { icon: "" },
}: {
  message: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  classNames: {
    icon?: string;
  };
}) => (
  <motion.div
    className="bg-background/80 absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 backdrop-blur-sm"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <Icon className={cn("text-primary mb-4 h-12 w-12", classNames.icon)} />
    </motion.div>
    <motion.h3
      className="mb-2 text-lg font-semibold"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.3 }}
    >
      {message}
    </motion.h3>
    <motion.p
      className="text-muted-foreground text-center text-sm"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {description}
    </motion.p>
  </motion.div>
);

interface MediaDragProps {
  isDragActive: boolean;
  isDragReject: boolean;
  media: StagedMediaItem[];
}

export default function MediaDrag({
  isDragActive,
  isDragReject,
  media,
}: MediaDragProps) {
  return (
    <AnimatePresence>
      {isDragActive &&
        (isDragReject ? (
          <DragOverlay
            message="Unsupported File Type"
            description="Please drop only supported image or video files."
            Icon={XCircle}
            classNames={{ icon: "text-destructive" }}
          />
        ) : media.length >= MAX_MEDIA_ITEMS ? (
          <DragOverlay
            message="Maximum Items Reached"
            description={`You can only add up to ${MAX_MEDIA_ITEMS} files.`}
            Icon={AlertCircle}
            classNames={{ icon: "text-destructive" }}
          />
        ) : (
          <DragOverlay
            message="Drop to Add Media"
            description="Your files will be staged for the post."
            Icon={UploadCloud}
          />
        ))}
    </AnimatePresence>
  );
}
