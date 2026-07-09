'use client';

import React from 'react';
import Image from 'next/image';
import { useLogin } from '../hooks/useLogin';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

export default function LoginPage() {
  // Extraemos la lógica (ya no necesitamos el PIN aquí)
  const { cedula, setCedula, error, isLoading, handleLogin } = useLogin();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabecera del Login */}
        <div className="bg-[#8B0000] p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-3 rounded-2xl mb-4 shadow-md">
            <Image src="/logo.png" alt="Logo El Español" width={80} height={40} className="object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">EL ESPAÑOL</h1>
          <p className="text-red-200 font-medium text-sm mt-1">Sistema de Evaluación Operativa</p>
        </div>

        {/* Formulario de Cero Fricción (Solo Cédula) */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <Input 
              label="Número de Cédula"
              type="number" 
              value={cedula} 
              onChange={(e) => setCedula(e.target.value)} 
              placeholder="Ej. 1712345678"
              required 
            />

            <Button 
              type="submit" 
              label={isLoading ? "Ingresando..." : "Entrar al Sistema"} 
              variant="primary" 
              disabled={isLoading} 
              className="mt-4"
            />
          </form>
        </div>
      </div>
      
      <p className="text-center text-gray-400 font-medium text-xs mt-8">
        Uso exclusivo para colaboradores de El Español.
      </p>
    </div>
  );
}