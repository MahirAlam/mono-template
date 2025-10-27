"use client";

import type { ToasterProps } from "sonner";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  const sonnerTheme: ToasterProps["theme"] =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "system";

  return (
    <Sonner
      theme={sonnerTheme}
      toastOptions={{
        classNames: {
          // The base toast will now use `bg-card` by default
          toast: "group toast bg-card text-foreground border-border shadow-lg",
          // Style the title (the main message) to be bold
          title: "font-semibold",
          // Style the description
          description: "text-muted-foreground",
          // The action/cancel buttons will inherit the variant's foreground color
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
