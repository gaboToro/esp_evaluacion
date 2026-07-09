'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'; // Agregamos createUser y signOut
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 

export default function LoginPage() {
  const [cedula, setCedula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const userCedula = user.email.split('@')[0];
        const userDoc = await getDoc(doc(db, 'usuarios', userCedula));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Si por alguna razón alguien inactivo tiene sesión iniciada, lo expulsamos
          if (userData.estado === 'Inactivo') {
            await signOut(auth);
            return;
          }

          if (userData.rol === 'Admin') router.push('/admin');
          else router.push('/evaluacion');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) return;
    
    setIsLoading(true);
    setErrorMensaje('');

    try {
      const emailFirebase = `${cedula.trim()}@elespanol.com`;
      const passwordFirebase = cedula.trim(); 

      // 1. PRIMERO: Buscar si el administrador autorizó a este usuario en Firestore
      const userDocRef = doc(db, 'usuarios', cedula.trim());
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setErrorMensaje('Tu usuario no está registrado en el sistema. Habla con el Administrador.');
        setIsLoading(false);
        return; // Detenemos el proceso
      }

      const userData = userDocSnap.data();

      // 2. SEGUNDO: Validar estrictamente si el usuario está activo
      if (userData.estado === 'Inactivo') {
        setErrorMensaje('Tu cuenta ha sido desactivada temporalmente. Habla con el Administrador.');
        setIsLoading(false);
        return; // Detenemos el proceso y bloqueamos el ingreso
      }

      // 3. TERCERO: Intentar Iniciar Sesión en Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, emailFirebase, passwordFirebase);
      } catch (authError: any) {
        // Si Firebase Auth lanza error porque el usuario no existe en su bóveda, lo creamos automáticamente
        const errorCode = authError.code;
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, emailFirebase, passwordFirebase);
            // Al crearse, la sesión se inicia automáticamente
          } catch (registerError: any) {
            console.error("Error al auto-registrar en Auth:", registerError);
            throw new Error('Hubo un error al registrar tus credenciales de seguridad.');
          }
        } else {
          // Si es un error distinto (ej. intentó poner otra contraseña), lo rechazamos
          throw authError; 
        }
      }

      // 4. CUARTO: Enrutamiento seguro basado en el rol ya verificado
      if (userData.rol === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/evaluacion');
      }

    } catch (error: any) {
      console.error("Error en login:", error);
      setErrorMensaje('Credenciales incorrectas o problema de conexión.');
      await signOut(auth); // Limpiamos cualquier intento fallido
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Logo El Español" width={120} height={120} className="object-contain" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Bienvenido</h1>
        <p className="text-gray-500 font-medium mb-8">Sistema de Evaluación Operativa</p>

        {errorMensaje && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-6 text-sm font-bold">
            {errorMensaje}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-left">
            <label className="block text-gray-700 font-bold mb-2 ml-1">
              Número de Cédula
            </label>
            <input
              type="number"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 17xxxxxxx"
              className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-[#8B0000] focus:ring-0 outline-none transition-colors font-bold text-gray-800 text-lg text-center tracking-widest"
              required
            />
            <p className="text-xs text-gray-400 mt-2 text-center font-medium">
              Usa tu cédula para ingresar
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !cedula}
            className="w-full bg-[#8B0000] hover:bg-red-800 text-white font-extrabold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg"
          >
            {isLoading ? 'Verificando...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
}