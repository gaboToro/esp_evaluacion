import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { iniciarSesion } from '../services/authService';

export const useLogin = () => {
  const router = useRouter();
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TRUCO DE CERO FRICCIÓN: Usamos la misma cédula como PIN interno para Firebase
      const pinInterno = cedula; 
      const userData: any = await iniciarSesion(cedula, pinInterno);
      
      // Enrutamiento por Roles
      if (userData && userData.rol === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/evaluacion');
      }
    } catch (err: any) {
      console.error(err);
      setError('Cédula no autorizada. Consulta con el Administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cedula, setCedula,
    error,
    isLoading,
    handleLogin
  };
};