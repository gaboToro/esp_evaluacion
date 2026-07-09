'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'; 
import { signOut, onAuthStateChanged } from 'firebase/auth'; 
import { useRouter } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Image from 'next/image';

const COLORS = ['#16a34a', '#dc2626']; 

export default function AdminDashboard() {
  const router = useRouter(); 
  
  const [evaluacionesGenerales, setEvaluacionesGenerales] = useState<any[]>([]);
  const [usuariosUnicos, setUsuariosUnicos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'tareas' | 'usuarios'>('dashboard');

  const [filtroUsuario, setFiltroUsuario] = useState<string>('General');
  const [filtroArea, setFiltroArea] = useState<string>('Todas');
  const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc'); 

  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<any | null>(null);

  // NUEVO: Estado para las alertas/notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  const [listaTareas, setListaTareas] = useState<any[]>([]);
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState('');
  const [nuevaTareaArea, setNuevaTareaArea] = useState('Caja');
  const [isCargandoTarea, setIsCargandoTarea] = useState(false);

  const [listaUsuariosBD, setListaUsuariosBD] = useState<any[]>([]);
  const [nuevoUsNombre, setNuevoUsNombre] = useState('');
  const [nuevoUsCedula, setNuevoUsCedula] = useState('');
  const [nuevoUsRol, setNuevoUsRol] = useState('Operario');
  const [isCargandoUsuario, setIsCargandoUsuario] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const cedula = user.email.split('@')[0];
        const userDoc = await getDoc(doc(db, 'usuarios', cedula));
        if (userDoc.exists() && userDoc.data().rol === 'Admin') {
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
      const qEval = query(collection(db, "evaluaciones"));
      const snapshotEval = await getDocs(qEval);
      const dataEval: any[] = [];
      const usuariosSet = new Set<string>();

      snapshotEval.forEach((documento) => {
        const evalData = documento.data();
        dataEval.push({ id: documento.id, timestamp: new Date(evalData.fechaCorta).getTime() || Date.now(), ...evalData });
        if (evalData.evaluadoNombre) usuariosSet.add(evalData.evaluadoNombre);
      });
      dataEval.reverse(); 
      setEvaluacionesGenerales(dataEval);
      setUsuariosUnicos(Array.from(usuariosSet));

      await cargarTareas();
      await cargarUsuarios();
      await cargarNotificaciones(); // NUEVO: Cargamos las alertas
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVO: Lógica para traer alertas de Firebase
  const cargarNotificaciones = async () => {
    const snapshotNotif = await getDocs(query(collection(db, "notificaciones")));
    const dataNotif: any[] = [];
    snapshotNotif.forEach((doc) => dataNotif.push({ id: doc.id, ...doc.data() }));
    // Ordenamos para que las más recientes salgan primero
    dataNotif.sort((a, b) => b.timestamp - a.timestamp);
    setNotificaciones(dataNotif);
  };

  // NUEVO: Lógica para marcar como leída y ocultar
  const marcarNotificacionLeida = async (id: string) => {
    try {
      await updateDoc(doc(db, "notificaciones", id), { leido: true });
      await cargarNotificaciones();
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const cargarTareas = async () => {
    const snapshotTareas = await getDocs(query(collection(db, "tareas")));
    const dataTareas: any[] = [];
    snapshotTareas.forEach((doc) => dataTareas.push({ id: doc.id, ...doc.data() }));
    setListaTareas(dataTareas);
  };

  const cargarUsuarios = async () => {
    const snapshotUsuarios = await getDocs(query(collection(db, "usuarios")));
    const dataUsuarios: any[] = [];
    snapshotUsuarios.forEach((doc) => dataUsuarios.push({ id: doc.id, ...doc.data() }));
    setListaUsuariosBD(dataUsuarios);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // --- LÓGICA DE USUARIOS ---
  const handleAgregarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoUsNombre.trim() || !nuevoUsCedula.trim()) return;
    if (nuevoUsCedula.length < 9) {
      alert("Por favor, ingresa un número de cédula válido.");
      return;
    }
    setIsCargandoUsuario(true);
    try {
      await setDoc(doc(db, "usuarios", nuevoUsCedula), {
        name: nuevoUsNombre, rol: nuevoUsRol, estado: 'Activo', tipoRacha: 'Positiva', contadorRacha: 0
      });
      setNuevoUsNombre(''); setNuevoUsCedula('');
      await cargarUsuarios(); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsCargandoUsuario(false);
    }
  };

  const handleToggleEstadoUsuario = async (usuario: any) => {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Cambiar estado al usuario ${usuario.name}?`)) return;
    await updateDoc(doc(db, "usuarios", usuario.id), { estado: nuevoEstado });
    await cargarUsuarios();
  };

  // --- LÓGICA DE TAREAS ---
  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaDesc.trim()) return;
    setIsCargandoTarea(true);
    try {
      await addDoc(collection(db, "tareas"), { descripcion: nuevaTareaDesc, area: nuevaTareaArea, estado: 'Activo' });
      setNuevaTareaDesc('');
      await cargarTareas(); 
    } catch (error) { console.error(error); } 
    finally { setIsCargandoTarea(false); }
  };

  const handleToggleEstadoTarea = async (tarea: any) => {
    const nuevoEstado = tarea.estado === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Cambiar estado de esta tarea?`)) return;
    await updateDoc(doc(db, "tareas", tarea.id), { estado: nuevoEstado });
    await cargarTareas();
  };

  const handleEliminarDefinitivoTarea = async (idTarea: string) => {
    if (!window.confirm("¿Deseas eliminarla por completo?")) return;
    await deleteDoc(doc(db, "tareas", idTarea));
    await cargarTareas();
  };

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

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-2xl font-bold text-[#8B0000] animate-pulse">Cargando Panel...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 relative">
      <header className="flex flex-col xl:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-6 border-l-8 border-[#8B0000] gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#8B0000] p-2 rounded-lg">
            <Image src="/logo.png" alt="Logo El Español" width={60} height={30} className="object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Panel de Administración</h1>
            <p className="text-gray-500 font-medium">Control total del local</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto">
            <button onClick={() => setVistaActual('dashboard')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'dashboard' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📊 Dashboard</button>
            <button onClick={() => setVistaActual('tareas')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'tareas' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📋 Tareas</button>
            <button onClick={() => setVistaActual('usuarios')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'usuarios' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>👥 Personal</button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-[#8B0000] border border-red-200 font-bold px-6 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm shrink-0">Cerrar Sesión</button>
        </div>
      </header>

      {/* NUEVO: ÁREA DE NOTIFICACIONES */}
      {notificaciones.filter(n => !n.leido).map(notif => (
        <div key={notif.id} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center animate-fade-in">
          <div className="mb-2 sm:mb-0">
            <span className="text-xl mr-2">🔔</span>
            <span className="font-bold">{notif.mensaje}</span>
            <span className="text-xs font-normal text-yellow-700 ml-2">({notif.fecha})</span>
          </div>
          <button 
            onClick={() => marcarNotificacionLeida(notif.id)} 
            className="text-yellow-700 hover:text-yellow-900 font-bold px-3 py-1 hover:bg-yellow-200 rounded-lg transition-colors text-sm"
          >
            ✕ Marcar como vista
          </button>
        </div>
      ))}

      {/* VISTA 1: DASHBOARD */}
      {vistaActual === 'dashboard' && (
        <div className="animate-fade-in">
           <div className="flex justify-end mb-6">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
              <span className="font-bold text-gray-700">Vista del Panel:</span>
              <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="bg-gray-50 border-2 border-[#8B0000] text-gray-800 font-bold py-1 px-3 rounded-lg focus:outline-none">
                <option value="General">🏢 Resumen General (Todos)</option>
                {usuariosUnicos.map((user, idx) => (<option key={idx} value={user}>👤 {user}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Termómetro de Rachas</h2>
              <div className="h-64 w-full"><ResponsiveContainer><PieChart><Pie data={statsRachas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{statsRachas.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Rendimiento Promedio por Área</h2>
              <div className="h-64 w-full"><ResponsiveContainer><BarChart data={promedioAreas}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="area" /><YAxis domain={[0, 100]} /><RechartsTooltip cursor={{fill: 'transparent'}} /><Bar dataKey="promedio" fill="#8B0000" radius={2} /></BarChart></ResponsiveContainer></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Registro de Auditoría</h2>
              <div className="flex gap-4">
                <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="bg-gray-50 border border-gray-300 py-1 px-3 rounded-lg text-sm font-medium"><option value="Todas">Todas las Áreas</option><option value="Caja">Caja</option><option value="Mesas">Mesas</option><option value="Elaboración">Elaboración</option></select>
                <select value={ordenFecha} onChange={(e) => setOrdenFecha(e.target.value as 'asc' | 'desc')} className="bg-gray-50 border border-gray-300 py-1 px-3 rounded-lg text-sm font-medium"><option value="desc">Más recientes primero</option><option value="asc">Más antiguos primero</option></select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 text-gray-600 border-b-2 border-gray-200"><th className="p-4 font-bold">Fecha</th><th className="p-4 font-bold text-[#8B0000]">Evaluado</th><th className="p-4 font-bold">Área</th><th className="p-4 font-bold">Puntaje</th><th className="p-4 font-bold text-right">Evaluador</th><th className="p-4 font-bold text-center">Acciones</th></tr></thead>
                <tbody>{datosParaTabla.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{e.fecha}</td>
                    <td className="p-4 font-extrabold text-gray-900">{e.evaluadoNombre}</td>
                    <td className="p-4 font-medium text-gray-700">{e.areaEvaluada}</td>
                    <td className="p-4 font-extrabold text-gray-800">{e.puntajeTotal}/100</td>
                    <td className="p-4 text-sm text-gray-500 text-right">{e.evaluadorNombre}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setEvaluacionSeleccionada(e)} className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg hover:bg-[#8B0000] hover:text-white transition-colors">
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: GESTIÓN DE TAREAS */}
      {vistaActual === 'tareas' && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-1 h-fit border-t-4 border-[#8B0000]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Añadir Nueva Tarea</h2>
            <form onSubmit={handleAgregarTarea} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Área Operativa</label>
                <select value={nuevaTareaArea} onChange={(e) => setNuevaTareaArea(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] font-medium"><option value="Caja">Caja</option><option value="Mesas">Mesas</option><option value="Elaboración">Elaboración</option></select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea value={nuevaTareaDesc} onChange={(e) => setNuevaTareaDesc(e.target.value)} placeholder="Ej: Revisar stock..." className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] font-medium" rows={3} required />
              </div>
              <button type="submit" disabled={isCargandoTarea} className="w-full bg-[#8B0000] text-white font-bold py-3 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">{isCargandoTarea ? 'Guardando...' : '+ Guardar Tarea'}</button>
            </form>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Catálogo de Tareas</h2>
            {['Caja', 'Mesas', 'Elaboración'].map((area) => (
              <div key={area} className="mb-8 last:mb-0">
                <h3 className="text-lg font-extrabold text-[#8B0000] mb-3 bg-red-50 p-2 rounded-lg">Área: {area}</h3>
                <div className="space-y-3">
                  {listaTareas.filter(t => t.area === area).map((tarea) => (
                    <div key={tarea.id} className={`flex justify-between items-center bg-gray-50 border p-3 rounded-xl ${tarea.estado === 'Inactivo' ? 'opacity-60 grayscale' : ''}`}>
                      <div className="flex flex-col">
                        <p className={`font-medium text-sm ${tarea.estado === 'Inactivo' ? 'line-through text-gray-500' : 'text-gray-700'}`}>{tarea.descripcion}</p>
                        <span className={`text-xs font-bold w-fit px-2 py-0.5 mt-1 rounded-full ${tarea.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{tarea.estado}</span>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <button onClick={() => handleToggleEstadoTarea(tarea)} className="p-2 rounded-lg font-bold text-xs">{tarea.estado === 'Activo' ? '⏸️ Pausar' : '▶️ Activar'}</button>
                        <button onClick={() => handleEliminarDefinitivoTarea(tarea.id)} className="text-red-500 p-2 rounded-lg font-bold text-xs">🗑️ Borrar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: GESTIÓN DE PERSONAL */}
      {vistaActual === 'usuarios' && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-1 h-fit border-t-4 border-[#8B0000]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Autorizar Trabajador</h2>
            <p className="text-sm text-gray-500 mb-6">Agrega los datos del colaborador. Podrá iniciar sesión usando su cédula.</p>
            
            <form onSubmit={handleAgregarUsuario} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" value={nuevoUsNombre} onChange={(e) => setNuevoUsNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número de Cédula</label>
                <input type="number" value={nuevoUsCedula} onChange={(e) => setNuevoUsCedula(e.target.value)} placeholder="17xxxxxxxx" className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rol en el Sistema</label>
                <select value={nuevoUsRol} onChange={(e) => setNuevoUsRol(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium">
                  <option value="Operario">Operario (Solo Evaluación)</option>
                  <option value="Admin">Administrador (Control Total)</option>
                </select>
              </div>
              <button type="submit" disabled={isCargandoUsuario} className="w-full bg-[#8B0000] text-white font-bold py-3 mt-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
                {isCargandoUsuario ? 'Registrando...' : '✓ Autorizar Usuario'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Nómina de Trabajadores Registrados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b-2 border-gray-200">
                    <th className="p-4 font-bold">Colaborador</th>
                    <th className="p-4 font-bold">Cédula / Login</th>
                    <th className="p-4 font-bold">Rol</th>
                    <th className="p-4 font-bold">Estado</th>
                    <th className="p-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaUsuariosBD.map((usuario) => (
                    <tr key={usuario.id} className={`border-b hover:bg-gray-50 transition-colors ${usuario.estado === 'Inactivo' ? 'opacity-50' : ''}`}>
                      <td className="p-4 font-bold text-gray-900">{usuario.name}</td>
                      <td className="p-4 font-medium text-gray-600">{usuario.id}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${usuario.rol === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${usuario.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {usuario.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {usuario.rol !== 'Admin' ? (
                          <button 
                            onClick={() => handleToggleEstadoUsuario(usuario)}
                            className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${usuario.estado === 'Activo' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          >
                            {usuario.estado === 'Activo' ? '🚫 Desactivar' : '✅ Reactivar'}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded-lg cursor-not-allowed inline-block" title="El administrador principal no puede ser desactivado">
                            🛡️ Intocable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listaUsuariosBD.length === 0 && (
                <p className="text-center text-gray-500 mt-6 font-medium">No hay usuarios registrados aún.</p>
              )}
            </div>
          </div>

        </div>
      )}
      
      {/* ===================== MODAL DE DETALLES DE EVALUACIÓN ===================== */}
      {evaluacionSeleccionada && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="bg-[#8B0000] p-4 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-lg">Detalles de Evaluación</h3>
              <button onClick={() => setEvaluacionSeleccionada(null)} className="text-white hover:text-red-200 font-bold text-xl px-2">✕</button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div><p className="text-xs text-gray-500 uppercase font-bold">Evaluado (Recibe Área)</p><p className="font-extrabold text-gray-900">{evaluacionSeleccionada.evaluadoNombre}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Evaluador (Entrega Área)</p><p className="font-bold text-gray-700">{evaluacionSeleccionada.evaluadorNombre}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Área</p><p className="font-bold text-[#8B0000]">{evaluacionSeleccionada.areaEvaluada}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Puntaje</p><p className={`font-extrabold ${evaluacionSeleccionada.puntajeTotal >= 80 ? 'text-green-600' : 'text-red-600'}`}>{evaluacionSeleccionada.puntajeTotal} / 100</p></div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Checklist de Tareas:</h4>
              <div className="space-y-2 mb-6">
                {!evaluacionSeleccionada.detalles || evaluacionSeleccionada.detalles.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay detalles registrados en esta evaluación antigua.</p>
                ) : (
                  evaluacionSeleccionada.detalles.map((detalle: any, index: number) => (
                    <div key={index} className={`flex justify-between items-start p-3 rounded-lg border-l-4 ${detalle.cumplio ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                      <span className={`text-sm font-medium ${!detalle.cumplio ? 'text-red-700 font-extrabold' : 'text-gray-700'}`}>
                        {detalle.descripcion}
                      </span>
                      <span className="shrink-0 ml-4">
                        {detalle.cumplio ? '✅ Cumplió' : '❌ Faltó'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Evidencia Fotográfica:</h4>
              <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center border-2 border-dashed border-gray-300">
                {evaluacionSeleccionada.fotosEvidencia && evaluacionSeleccionada.fotosEvidencia.length > 0 ? (
                  <p className="text-gray-500 text-sm">Aquí se mostrará la foto en el futuro.</p>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl block mb-2">📷</span>
                    <p className="text-gray-500 text-sm font-medium">Sin evidencia fotográfica subida.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}