import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { iniciarSesion } from '../services/authService';

export const useLogin = () => {
  const router = useRouter();
  const [cedula, setCedula] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userData: any = await iniciarSesion(cedula, pin);
      
      // Enrutamiento por Roles
      if (userData && userData.rol === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/evaluacion');
      }
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas. Verifica tu cédula y PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cedula, setCedula,
    pin, setPin,
    error,
    isLoading,
    handleLogin
  };
};