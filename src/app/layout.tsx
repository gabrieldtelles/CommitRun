import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const monoCode = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CommitRun — aprenda git resolvendo missões",
    template: "%s · CommitRun",
  },
  description:
    "Treine git de verdade em um terminal simulado: missões curtas, validação automática e um grafo que mostra cada commit que você cria.",
  openGraph: {
    title: "CommitRun — aprenda git resolvendo missões",
    description: "Treine git de verdade em um terminal simulado, missão por missão.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${monoCode.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
