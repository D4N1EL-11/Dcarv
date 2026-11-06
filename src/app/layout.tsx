import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { RegistrarServiceWorker } from '@/components/pwa/RegistrarServiceWorker';

const fuenteTitulos = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const fuenteTexto = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Soporte de Salas',
  applicationName: 'Soporte de Salas',
  description:
    'Control de calidad y soporte técnico de las salas de cómputo: inventario de equipos, incidencias, estados e historial.',
  // Instalada en el celular (PWA): nombre corto y barra de estado oscura en iPhone.
  appleWebApp: { capable: true, title: 'Soporte', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#111214', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fuenteTitulos.variable} ${fuenteTexto.variable}`}>
      <body>
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
