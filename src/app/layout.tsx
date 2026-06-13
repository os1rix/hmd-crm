import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/session";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HMD CRM",
  description: "AI-native CRM for HMD Secure",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
