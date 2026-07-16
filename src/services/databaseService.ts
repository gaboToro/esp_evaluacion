import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { serverTimestamp } from 'firebase/firestore';

// ==========================================
// MÓDULO DE USUARIOS
// ==========================================
export const getUsuarioPorCedula = async (cedula: string) => {
  const userDocRef = doc(db, 'usuarios', cedula);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? { id: userDocSnap.id, ...userDocSnap.data() } : null;
};

export const getTodosLosUsuarios = async () => {
  const snapshot = await getDocs(query(collection(db, "usuarios")));
  const usuarios: any[] = [];
  snapshot.forEach((doc) => usuarios.push({ id: doc.id, ...doc.data() }));
  return usuarios;
};

export const autorizarUsuario = async (cedula: string, data: any) => {
  await setDoc(doc(db, "usuarios", cedula), data);
};

export const cambiarEstadoUsuario = async (id: string, nuevoEstado: string) => {
  await updateDoc(doc(db, "usuarios", id), { estado: nuevoEstado });
};

export const actualizarRachaUsuario = async (id: string, tipoRacha: string, contador: number) => {
  await updateDoc(doc(db, 'usuarios', id), { tipoRacha, contadorRacha: contador });
};


// ==========================================
// MÓDULO DE TAREAS
// ==========================================
export const getTodasLasTareas = async () => {
  const snapshot = await getDocs(query(collection(db, "tareas")));
  const tareas: any[] = [];
  snapshot.forEach((doc) => tareas.push({ id: doc.id, ...doc.data() }));
  return tareas;
};

export const getTareasActivasPorArea = async (area: string) => {
  const q = query(collection(db, "tareas"), where("area", "==", area));
  const snapshot = await getDocs(q);
  const tareas: any[] = [];
  snapshot.forEach((doc) => {
    const tarea = doc.data();
    if (tarea.estado !== 'Inactivo') tareas.push({ id: doc.id, ...tarea });
  });
  return tareas;
};

export const crearTarea = async (data: any) => {
  await addDoc(collection(db, "tareas"), data);
};

export const cambiarEstadoTarea = async (id: string, nuevoEstado: string) => {
  await updateDoc(doc(db, "tareas", id), { estado: nuevoEstado });
};

export const eliminarTareaDefinitiva = async (id: string) => {
  await deleteDoc(doc(db, "tareas", id));
};


// ==========================================
// MÓDULO DE EVALUACIONES
// ==========================================
export const getTodasLasEvaluaciones = async () => {
  const snapshot = await getDocs(query(collection(db, "evaluaciones")));
  const evaluaciones: any[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    evaluaciones.push({ id: doc.id, timestamp: new Date(data.fechaCorta).getTime() || Date.now(), ...data });
  });
  return evaluaciones.reverse();
};

export const verificarSiYaEvaluoHoy = async (campoCedula: 'evaluadorCedula' | 'evaluadoCedula', cedula: string, fechaCorta: string) => {
  const q = query(collection(db, "evaluaciones"), where(campoCedula, "==", cedula), where("fechaCorta", "==", fechaCorta));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const guardarEvaluacion = async (data: any) => {
  // Combinamos los datos entrantes con el nuevo campo fechaTimestamp
  const dataConTimestamp = {
    ...data,
    fechaTimestamp: serverTimestamp()
  };
  
  await addDoc(collection(db, "evaluaciones"), dataConTimestamp);
};

// ==========================================
// MÓDULO DE NOTIFICACIONES
// ==========================================
export const getNotificaciones = async () => {
  const snapshot = await getDocs(query(collection(db, "notificaciones")));
  const notificaciones: any[] = [];
  snapshot.forEach((doc) => notificaciones.push({ id: doc.id, ...doc.data() }));
  return notificaciones.sort((a, b) => b.timestamp - a.timestamp);
};

export const crearNotificacion = async (data: any) => {
  await addDoc(collection(db, "notificaciones"), data);
};

export const marcarNotificacionLeida = async (id: string) => {
  await updateDoc(doc(db, "notificaciones", id), { leido: true });
};