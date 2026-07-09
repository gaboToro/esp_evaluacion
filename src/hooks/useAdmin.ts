import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as dbService from '../services/databaseService';

export const useAdmin = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'tareas' | 'usuarios'>('dashboard');

  // Estados del Dashboard y Notificaciones
  const [evaluacionesGenerales, setEvaluacionesGenerales] = useState<any[]>([]);
  const [usuariosUnicos, setUsuariosUnicos] = useState<string[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<string>('General');
  const [filtroArea, setFiltroArea] = useState<string>('Todas');
  const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc');
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<any | null>(null);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  // Estados de Tareas
  const [listaTareas, setListaTareas] = useState<any[]>([]);
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState('');
  const [nuevaTareaArea, setNuevaTareaArea] = useState('Caja');
  const [isCargandoTarea, setIsCargandoTarea] = useState(false);

  // Estados de Usuarios
  const [listaUsuariosBD, setListaUsuariosBD] = useState<any[]>([]);
  const [nuevoUsNombre, setNuevoUsNombre] = useState('');
  const [nuevoUsCedula, setNuevoUsCedula] = useState('');
  const [nuevoUsRol, setNuevoUsRol] = useState('Operario');
  const [isCargandoUsuario, setIsCargandoUsuario] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const cedula = user.email.split('@')[0];
        const userData: any = await dbService.getUsuarioPorCedula(cedula);
        
        if (userData && userData.rol === 'Admin') {
          await fetchData();
        } else {
          router.replace('/evaluacion');
        }
      } else {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      // 1. Cargar Evaluaciones
      const dataEval = await dbService.getTodasLasEvaluaciones();
      const usuariosSet = new Set<string>();
      dataEval.forEach((e: any) => {
        if (e.evaluadoNombre) usuariosSet.add(e.evaluadoNombre);
      });
      setEvaluacionesGenerales(dataEval);
      setUsuariosUnicos(Array.from(usuariosSet));

      // 2. Cargar el resto de módulos
      await cargarTareas();
      await cargarUsuarios();
      await cargarNotificaciones();
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarNotificaciones = async () => {
    const dataNotif = await dbService.getNotificaciones();
    setNotificaciones(dataNotif);
  };

  const marcarNotificacionLeida = async (id: string) => {
    await dbService.marcarNotificacionLeida(id);
    await cargarNotificaciones();
  };

  const cargarTareas = async () => {
    const dataTareas = await dbService.getTodasLasTareas();
    setListaTareas(dataTareas);
  };

  const cargarUsuarios = async () => {
    const dataUsuarios = await dbService.getTodosLosUsuarios();
    setListaUsuariosBD(dataUsuarios);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  // --- HANDLERS USUARIOS ---
  const handleAgregarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoUsNombre.trim() || !nuevoUsCedula.trim()) return;
    if (nuevoUsCedula.length < 9) return alert("Ingresa un número de cédula válido.");
    
    setIsCargandoUsuario(true);
    try {
      await dbService.autorizarUsuario(nuevoUsCedula, {
        name: nuevoUsNombre, rol: nuevoUsRol, estado: 'Activo', tipoRacha: 'Positiva', contadorRacha: 0
      });
      setNuevoUsNombre(''); setNuevoUsCedula('');
      await cargarUsuarios();
    } catch (error) { console.error(error); } 
    finally { setIsCargandoUsuario(false); }
  };

  const handleToggleEstadoUsuario = async (usuario: any) => {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Cambiar estado al usuario ${usuario.name}?`)) return;
    await dbService.cambiarEstadoUsuario(usuario.id, nuevoEstado);
    await cargarUsuarios();
  };

  // --- HANDLERS TAREAS ---
  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaDesc.trim()) return;
    setIsCargandoTarea(true);
    try {
      await dbService.crearTarea({ descripcion: nuevaTareaDesc, area: nuevaTareaArea, estado: 'Activo' });
      setNuevaTareaDesc('');
      await cargarTareas();
    } catch (error) { console.error(error); } 
    finally { setIsCargandoTarea(false); }
  };

  const handleToggleEstadoTarea = async (tarea: any) => {
    const nuevoEstado = tarea.estado === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Cambiar estado de esta tarea?`)) return;
    await dbService.cambiarEstadoTarea(tarea.id, nuevoEstado);
    await cargarTareas();
  };

  const handleEliminarDefinitivoTarea = async (idTarea: string) => {
    if (!window.confirm("¿Deseas eliminarla por completo?")) return;
    await dbService.eliminarTareaDefinitiva(idTarea);
    await cargarTareas();
  };

  // --- USE MEMOS (Cálculos de Gráficos) ---
  const datosParaGraficos = useMemo(() => {
    if (filtroUsuario === 'General') return evaluacionesGenerales;
    return evaluacionesGenerales.filter(e => e.evaluadoNombre === filtroUsuario);
  }, [evaluacionesGenerales, filtroUsuario]);

  const statsRachas = useMemo(() => {
    let pos = 0, neg = 0;
    datosParaGraficos.forEach(e => { if (e.puntajeTotal >= 80) pos++; else neg++; });
    return [{ name: 'Racha Positiva', value: pos }, { name: 'Racha Negativa', value: neg }];
  }, [datosParaGraficos]);

  const promedioAreas = useMemo(() => {
    const areas = { 'Caja': { t: 0, c: 0 }, 'Mesas': { t: 0, c: 0 }, 'Elaboración': { t: 0, c: 0 } };
    datosParaGraficos.forEach(e => {
      if (areas[e.areaEvaluada as keyof typeof areas]) {
        areas[e.areaEvaluada as keyof typeof areas].t += e.puntajeTotal;
        areas[e.areaEvaluada as keyof typeof areas].c += 1;
      }
    });
    return Object.keys(areas).map(a => ({
      area: a, promedio: areas[a as keyof typeof areas].c > 0 ? Math.round(areas[a as keyof typeof areas].t / areas[a as keyof typeof areas].c) : 0
    }));
  }, [datosParaGraficos]);

  const datosParaTabla = useMemo(() => {
    let datos = [...datosParaGraficos];
    if (filtroArea !== 'Todas') datos = datos.filter(e => e.areaEvaluada === filtroArea);
    if (ordenFecha === 'asc') datos.reverse(); 
    return datos;
  }, [datosParaGraficos, filtroArea, ordenFecha]);

  return {
    isLoading, vistaActual, setVistaActual, usuariosUnicos, filtroUsuario, setFiltroUsuario,
    filtroArea, setFiltroArea, ordenFecha, setOrdenFecha, evaluacionSeleccionada, setEvaluacionSeleccionada,
    notificaciones, marcarNotificacionLeida, listaTareas, nuevaTareaDesc, setNuevaTareaDesc,
    nuevaTareaArea, setNuevaTareaArea, isCargandoTarea, handleAgregarTarea, handleToggleEstadoTarea,
    handleEliminarDefinitivoTarea, listaUsuariosBD, nuevoUsNombre, setNuevoUsNombre, nuevoUsCedula,
    setNuevoUsCedula, nuevoUsRol, setNuevoUsRol, isCargandoUsuario, handleAgregarUsuario,
    handleToggleEstadoUsuario, handleLogout, statsRachas, promedioAreas, datosParaTabla
  };
};