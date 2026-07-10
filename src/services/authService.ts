import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUsuarioPorCedula } from './databaseService';

// Servicio puro para manejar el login de Firebase
export const iniciarSesion = async (cedula: string, pin: string) => {
  const correoInterno = `${cedula}@elespanol.com`; 
  
  // 1. Buscamos el rol del usuario en nuestra base de datos PRIMERO
  // Agregamos ": any" para evitar el error de TypeScript con la propiedad 'estado'
  const datosUsuario: any = await getUsuarioPorCedula(cedula);
  
  // Si el admin no lo ha creado en la BD o está inactivo, bloqueamos el acceso
  if (!datosUsuario || datosUsuario.estado === 'Inactivo') {
    throw new Error('Usuario no autorizado o inactivo');
  }
  
  // 2. Intentamos Autenticar con Firebase
  try {
    await signInWithEmailAndPassword(auth, correoInterno, pin);
  } catch (error: any) {
    // 3. Si falla porque no existe en Auth (pero sí en la BD), lo creamos al vuelo
    if (
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/invalid-credential' || 
      error.code === 'auth/invalid-login-credentials'
    ) {
      try {
        // Registramos al usuario en Firebase Authentication en este instante
        await createUserWithEmailAndPassword(auth, correoInterno, pin);
      } catch (createError) {
        console.error("Error al registrar en Auth:", createError);
        throw new Error('No se pudo crear la credencial de acceso.');
      }
    } else {
      // Si es otro error (ej. demasiados intentos), lo lanzamos
      throw error;
    }
  }
  
  return datosUsuario;
};