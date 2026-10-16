import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/inter";
import "./globals.css";
export const metadata: Metadata = {
  title: "LeadFlow — Every connection, moving forward",
  description:
    "A focused workspace for your leads, conversations, and follow-ups.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
