import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { basicInfo } from "@tera/config";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { Toaster } from "sonner";

import ThemeProvider from "~/components/ThemeProvider";
import { getBaseUrl } from "~/lib/helpers";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    template: `%s |  ${basicInfo.basic.title}`,
    default: basicInfo.basic.title,
  },
  applicationName: basicInfo.basic.title,
  description: basicInfo.basic.description,
  openGraph: {
    title: basicInfo.basic.title,
    description: basicInfo.basic.description,
    url: getBaseUrl(),
    siteName: basicInfo.basic.title,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
