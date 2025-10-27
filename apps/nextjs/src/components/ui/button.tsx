"use client";

import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  // Base styles
  "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // All color variants are unchanged
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-input bg-accent/50 hover:bg-accent hover:text-accent-foreground border",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        "success-outline":
          "border-success text-success hover:bg-success/10 border",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
        "warning-outline":
          "border-warning text-warning hover:bg-warning/10 border",
        info: "bg-info text-info-foreground hover:bg-info/90",
        "info-outline": "border-info text-info hover:bg-info/10 border",
      },
      effect: {
        // All previous effects are here, plus the new ones
        none: "",
        pulse: "animate-pulse-button", // Assumes pulse-button keyframes are defined
        pulseHover: "hover:scale-105 active:scale-95",
        // NEW: A more pronounced scaling effect
        scaleUp: "hover:scale-110 active:scale-100",
        // NEW: Base class for the glow effect to ensure a smooth transition
        glow: "hover:shadow-background shadow-md",
        shine:
          "animate-shine bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:200%_100%]",
        shineHover:
          "hover:bg-position-right bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.5),transparent)] bg-[length:200%_100%] bg-no-repeat transition-[background-position] duration-500",
        expandIcon: "group",
        ringHover: "hover:ring-2 hover:ring-offset-2",
        gooeyRight:
          "before:from-primary relative z-0 overflow-hidden before:absolute before:inset-0 before:-z-10 before:translate-x-[-150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-gradient-to-r before:transition-transform before:duration-1000 hover:before:translate-x-0 hover:before:translate-y-0",
        gooeyLeft:
          "after:from-primary relative z-0 overflow-hidden after:absolute after:inset-0 after:-z-10 after:translate-x-[150%] after:translate-y-[-150%] after:scale-[2.5] after:rounded-[100%] after:bg-gradient-to-l after:transition-transform after:duration-1000 hover:after:translate-x-0 hover:after:translate-y-0",
        underline:
          "after:bg-primary relative after:absolute after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-left after:scale-x-100 after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-right hover:after:scale-x-0",
        hoverUnderline:
          "after:bg-primary relative after:absolute after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-left hover:after:scale-x-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    // *** THE MAGIC IS HERE ***
    // We use compound variants to apply the correct glow color
    // based on the button's main color variant.
    compoundVariants: [
      {
        variant: "default",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--primary)]",
      },
      {
        variant: "destructive",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--destructive)]",
      },
      {
        variant: "secondary",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--secondary)]",
      },
      {
        variant: "success",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--success)]",
      },
      {
        variant: "warning",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--warning)]",
      },
      {
        variant: "info",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--info)]",
      },
      // You can even add it for outline buttons
      {
        variant: "outline",
        effect: "glow",
        className: "hover:shadow-[0_0_15px_var(--accent)]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      effect: "none",
    },
  },
);

// --- Prop Types ---
// No changes needed here. It's clean and simple.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ElementType;
  iconPlacement?: "left" | "right";
}

// --- Component ---
// No changes needed here. The logic is handled by CVA.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      effect,
      asChild = false,
      icon: Icon,
      iconPlacement = "left",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, effect, className }))}
        ref={ref}
        {...props}
      >
        {Icon &&
          iconPlacement === "left" &&
          (effect === "expandIcon" ? (
            <div className="w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100">
              <Icon />
            </div>
          ) : (
            <Icon />
          ))}

        <Slottable>{children}</Slottable>

        {Icon &&
          iconPlacement === "right" &&
          (effect === "expandIcon" ? (
            <div className="w-0 translate-x-full pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100">
              <Icon />
            </div>
          ) : (
            <Icon />
          ))}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
