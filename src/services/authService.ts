import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUsuarioPorCedula } from './databaseService';

// Servicio puro para manejar el login de Firebase
export const iniciarSesion = async (cedula: string, pin: string) => {
  // Como Firebase Auth pide un correo, transformamos la cédula en un correo interno
  const correoInterno = `${cedula}@elespanol.com`; 
  
  // 1. Autenticamos con Firebase
  const credenciales = await signInWithEmailAndPassword(auth, correoInterno, pin);
  
  // 2. Buscamos el rol del usuario en nuestra base de datos para saber a dónde enviarlo
  const datosUsuario = await getUsuarioPorCedula(cedula);
  
  return datosUsuario;
};