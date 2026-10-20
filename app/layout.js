import "./globals.css";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  title: "Painel Reengajamento",
  description: "Controle do fluxo de reengajamento de bloqueio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
