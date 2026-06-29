import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Embermood — La soirée parfaite",
  description: "Votre assistant soirée personnalisé par l'IA",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#0a0a14', color: 'white', minHeight: '100vh', margin: 0 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
