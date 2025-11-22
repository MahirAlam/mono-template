import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const cardVariants = cva(
  "rounded-xl border text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border-border shadow-sm hover:shadow-md",
        elevated: "bg-card border-border shadow-md hover:shadow-lg",
        flat: "bg-surface-2 border-0 shadow-none hover:bg-surface-3",
        subtle: "bg-surface-1 border-0 shadow-none",
        ghost: "bg-transparent border-none hover:bg-surface-1",
        transparent: "bg-transparent border-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  },
);

export type CardVariants = VariantProps<typeof cardVariants>;
