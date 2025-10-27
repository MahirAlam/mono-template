import type { IconProps } from "@tabler/icons-react";
import type { VariantProps } from "class-variance-authority";
import { IconLoader2 } from "@tabler/icons-react";
import { cva } from "class-variance-authority";

import { cn } from "~/lib/utils";

const IndicatorVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
      destructive: "text-destructive",
      muted: "text-muted",
    },
    size: {
      default: "h-4 w-4",
      sm: "h-3 w-3",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-7 w-7",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type IndicatorProps = {
  spin?: boolean;
  withText?: string;
} & IconProps &
  VariantProps<typeof IndicatorVariants>;

const LoadingIndicator = ({
  className,
  spin = true,
  withText,
  ...props
}: IndicatorProps) => {
  return (
    <div
      className={cn(
        withText && "flex-wrap gap-2",
        "flex items-center justify-center",
      )}
    >
      <IconLoader2
        className={cn(
          spin && "animate-spin",
          className,
          IndicatorVariants({ className }),
        )}
        {...props}
      />
      {withText && (
        <span className={cn(IndicatorVariants({ className }), "size-auto")}>
          {withText}
        </span>
      )}
    </div>
  );
};
LoadingIndicator.displayName = "LoadingIndicator";

export { IndicatorVariants, LoadingIndicator };
