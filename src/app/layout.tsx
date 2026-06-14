import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/session";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HMD Secure CRM",
  description: "AI-native CRM for HMD Secure",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem("hmd-appearance");var t=a==="light"||a==="dark"?a:(a==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t||"dark";document.documentElement.style.colorScheme=t||"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} h-screen overflow-hidden antialiased`}>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
