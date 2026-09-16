import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clicia Macena | Agendamentos",
  description: "Agende seu horário com Clicia Macena de forma simples, rápida e segura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}