import React from "react";

export const metadata = {
  title: "GotaCerta — Telemetria Cidadã de Hidrômetros",
  description: "Monitoramento ágil de consumo de água, detecção de vazamentos ocultos e alerta comunitário.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-slate-900 border-x border-slate-800 flex flex-col shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
