/**
 * @file A centralized, type-safe library for displaying notifications (toasts)
 * that match the application's Figma design. Automatically switches between
 * light and dark (solid/gradient) themes based on user's system preference.
 *
 * @example
 * import { toasts } from "~/lib/toasts";
 *
 * // This one function will render a light toast in light mode,
 * // and a solid/gradient toast in dark mode.
 * toasts.destructive("Error Occurred", {
 *   description: "Sorry, please try again later.",
 * });
 */

import type { ExternalToast } from "sonner";
import { IconX } from "@tabler/icons-react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ToastVariant = "success" | "info" | "warning" | "destructive";

// The single, powerful toast creation function
const createToast = (
  variant: ToastVariant,
  title: React.ReactNode,
  options?: ExternalToast,
) => {
  // Map variants to their respective icons and class strings
  const variantConfig = {
    success: {
      Icon: CheckCircle2,
      iconClassName: "!text-success",
      className: "!text-success",
    },
    info: {
      Icon: Info,
      iconClassName: "!text-info",
      className: "!text-info",
    },
    warning: {
      Icon: AlertTriangle,
      className: "!text-warning",
      iconClassName: "!text-warning",
    },
    destructive: {
      Icon: AlertCircle,
      iconClassName: "!text-destructive",
      className: "!text-destructive",
    },
  };

  const { Icon, className, iconClassName } = variantConfig[variant];

  return toast(title, {
    ...options,
    cancel: !options?.cancel
      ? {
          label: <IconX className={`text-card-foreground size-7`} />,
          onClick: () => {},
        }
      : options?.cancel,
    icon: <Icon className={`${iconClassName} size-7`} />,
    classNames: {
      ...options?.classNames,
      cancelButton: "!bg-transparent !text-card-foreground",
      icon: "flex items-center justify-center",
      content: "flex-1 ml-2",
      toast: `${options?.classNames?.toast ?? ""} !bg-card/95 !gap-2 !border-border !border-1 ${className}`,
      description: "!text-muted-foreground",
      // Action button styles that work well on both light and dark backgrounds
      actionButton: "!bg-transparent !text-card-foreground",
      closeButton: "!bg-transparent !text-card-foreground",
    },
  });
};

// The final, simplified, and powerful API
export const toasts = {
  /** Displays a success toast. Auto-adapts to light/dark mode. */
  success: (title: React.ReactNode, options?: ExternalToast) =>
    createToast("success", title, options),

  /** Displays an informational toast. Auto-adapts to light/dark mode. */
  info: (title: React.ReactNode, options?: ExternalToast) =>
    createToast("info", title, options),

  /** Displays a warning toast. Auto-adapts to light/dark mode. */
  warning: (title: React.ReactNode, options?: ExternalToast) =>
    createToast("warning", title, options),

  /** Displays a destructive/error toast. Auto-adapts to light/dark mode. */
  destructive: (title: React.ReactNode, options?: ExternalToast) =>
    createToast("destructive", title, options),

  /** Displays a loading toast. Uses default card styling. */
  loading: (title: React.ReactNode, options?: ExternalToast) =>
    toast.loading(title, {
      ...options,
      icon: <Loader2 className="text-card-foreground size-5 animate-spin" />,
      classNames: {
        ...options?.classNames,
        icon: "flex items-center justify-center",
        toast: `${options?.classNames?.toast ?? ""} !bg-card/95 !gap-4 !border-border !border-1 text-card-foreground`,
        description: "!text-muted-foreground",
        // Action button styles that work well on both light and dark backgrounds
        actionButton:
          "group-[.toast]:bg-white/10 group-[.toast]:text-inherit group-[.toast]:hover:bg-white/20 dark:group-[.toast]:bg-black/20 dark:group-[.toast]:hover:bg-black/30",
        closeButton:
          "group-[.toast]:bg-transparent group-[.toast]:border-transparent group-[.toast]:hover:bg-black/5 dark:group-[.toast]:hover:bg-white/10",
      },
    }),

  /** Dismisses a toast by its ID. */
  dismiss: (toastId: string | number) => toast.dismiss(toastId),
};
