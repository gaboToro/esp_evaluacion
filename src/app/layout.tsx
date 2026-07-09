import './globals.css'; // Importamos nuestro diseño maestro
import React from 'react';

export const metadata = {
  title: 'El Español - Evaluación Operativa',
  description: 'Sistema interno de entrega de áreas, revisión de stock y evaluación diaria de colaboradores.',
  // Preparado para el futuro: si haces la PWA, aquí se vinculan los iconos
  themeColor: '#8B0000', 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* 
        El <body> actúa como nuestra plantilla base. 
        Al poner "min-h-screen" y "bg-gray-50" aquí, ninguna de nuestras 
        páginas individuales tendrá que preocuparse por configurar el fondo.
      */}
      <body className="min-h-screen bg-gray-50 flex flex-col font-sans">
        
        {/* Contenedor centralizado para limitar el ancho máximo en pantallas grandes y mantener el estándar */}
        <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto">
          {children}
        </main>
        
      </body>
    </html>
  );
}