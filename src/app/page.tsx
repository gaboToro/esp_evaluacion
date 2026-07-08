'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

export default function LoginPage() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TRUCO: Firebase exige un correo. Unimos la cédula con un dominio falso de la empresa.
      // Si la cédula es 1712345678, Firebase recibirá "1712345678@elespanol.com"
      const correoFirebase = `${cedula}@elespanol.com`;
      
      await signInWithEmailAndPassword(auth, correoFirebase, password);
      router.push('/evaluacion');
    } catch (err) {
      setError('Credenciales incorrectas. Verifica tu número de cédula.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
        
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Logo El Español" width={120} height={120} className="object-contain" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Bienvenido</h1>
        <p className="text-gray-600 font-medium mb-8">Ingresa tu cédula para continuar</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Número de Cédula" 
            type="number" 
            placeholder="Ej: 1234567890"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
          
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="Ingresa tu cédula nuevamente"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-800 font-bold bg-red-100 p-4 rounded-xl border border-red-300">{error}</p>}

          <div className="pt-4">
            <Button 
              label={isLoading ? "Ingresando..." : "INGRESAR"} 
              variant="primary" 
              onClick={() => {}} 
            />
          </div>
        </form>
        
      </div>
    </div>
  );
}