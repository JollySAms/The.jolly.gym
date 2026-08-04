import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Jolly Gym",
  description: "Jouw trainingsapp van The Jolly Gym",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jolly Gym",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ConvexAuthNextjsServerProvider>
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
