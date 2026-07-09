'use client';

import React from 'react';
import Image from 'next/image';
import { useLogin } from '../hooks/useLogin';
import { Button } from '../components/atoms/Button';

export default function LoginPage() {
  // Extraemos toda la lógica pesada desde nuestro Custom Hook
  const { cedula, setCedula, pin, setPin, error, isLoading, handleLogin } = useLogin();

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

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">Número de Cédula</label>
              <input 
                type="number" 
                value={cedula} 
                onChange={(e) => setCedula(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B0000] focus:ring-0 transition-colors font-medium text-gray-900"
                placeholder="Ej. 1712345678"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">PIN de Acceso</label>
              <input 
                type="password" 
                value={pin} 
                onChange={(e) => setPin(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B0000] focus:ring-0 transition-colors font-medium text-gray-900"
                placeholder="••••••"
                required 
              />
            </div>

            <Button 
              type="submit" 
              label={isLoading ? "Verificando..." : "Ingresar al Sistema"} 
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