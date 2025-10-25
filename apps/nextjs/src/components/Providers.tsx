import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";

interface Props extends ThemeProviderProps {
  children: ReactNode;
}

const Providers = ({ children, ...props }: Props) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      <TRPCReactProvider>
        <AuthQueryProvider>{children}</AuthQueryProvider>
      </TRPCReactProvider>
      <Toaster />
    </NextThemeProvider>
  );
};

export default Providers;
