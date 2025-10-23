import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

interface Props extends ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children, ...props }: Props) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
};

export default ThemeProvider;
