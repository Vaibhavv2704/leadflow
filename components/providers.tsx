"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
function Notifications() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      richColors
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={client}>
        {children}
        <Notifications />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
