import "./globals.css";

export const metadata = {
  title: "Painel Reengajamento",
  description: "Controle do fluxo de reengajamento de bloqueio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
