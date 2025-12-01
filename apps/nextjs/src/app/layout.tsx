import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { basicInfo } from "@tera/config";

import "~/styles/globals.css";

import { Suspense } from "react";
import { connection } from "next/server";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import Providers from "~/components/Providers";
import { getBaseUrl } from "~/lib/helpers";
import ourFileRouter from "~/lib/uploadthing";
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
  variable: "--font-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

async function UTS() {
  await connection();

  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
        id="main-body"
      >
        <Suspense>
          <UTS />
        </Suspense>
        <Providers>{props.children}</Providers>
      </body>
    </html>
  );
}
