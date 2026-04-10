import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextChat — AI-Powered Conversations | 3D Chat Platform",
  description:
    "NextChat is a real-time AI chatbot platform with 3D animations, deep research mode, analytics dashboard, and beautiful modern UI. Powered by AI.",
  keywords: [
    "AI Chat",
    "NextChat",
    "Chatbot",
    "AI Assistant",
    "Deep Research",
    "3D Chat",
    "Real-time Chat",
    "Analytics Dashboard",
    "Modern Chat UI",
  ],
  icons: {
    icon: "/chatbot-avatar.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NextChat",
  },
  openGraph: {
    title: "NextChat — AI-Powered Conversations",
    description:
      "Experience the future of chat with real-time AI responses, deep research mode, and beautiful 3D animations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
