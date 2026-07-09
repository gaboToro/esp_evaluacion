'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { db, auth } from '../../lib/firebase'; 
import { useEvaluationStore } from '../../store/evaluationStore';
import { Button } from '../../components/atoms/Button';

export default function EvaluacionPage() {
  const { score, decreaseScore, resetScore } = useEvaluationStore();
  const router = useRouter();
  
  const [userName, setUserName] = useState<string>('');
  const [userCedula, setUserCedula] = useState<string>('');
  
  // NUEVO: Estados para la racha propia del usuario que evalúa
  const [userTipoRacha, setUserTipoRacha] = useState<string>('Positiva');
  const [userContadorRacha, setUserContadorRacha] = useState<number>(0);

  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selectedEvaluado, setSelectedEvaluado] = useState<any | null>(null);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [detallesEvaluacion, setDetallesEvaluacion] = useState<{descripcion: string, cumplio: boolean}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false); 
  const [rachaAlert, setRachaAlert] = useState<string | null>(null);
  const [hasEvaluatedToday, setHasEvaluatedToday] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const cedula = user.email.split('@')[0]; 
        setUserCedula(cedula);
        
        try {
          const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });

          const qEvaluador = query(
            collection(db, "evaluaciones"), 
            where("evaluadorCedula", "==", cedula), 
            where("fechaCorta", "==", fechaSoloDia)
          );
          const evaluadorSnap = await getDocs(qEvaluador);
          
          if (!evaluadorSnap.empty) {
            setHasEvaluatedToday(true); 
          }

          const userDocRef = doc(db, 'usuarios', cedula);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserName(data.name || `Cédula: ${cedula}`);
            // NUEVO: Cargamos su racha para mostrarla en pantalla
            setUserTipoRacha(data.tipoRacha || 'Positiva');
            setUserContadorRacha(data.contadorRacha || 0);
          }

          const qUsers = query(collection(db, "usuarios"));
          const usersSnapshot = await getDocs(qUsers);
          const listaColaboradores: any[] = [];
          
          usersSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id !== cedula && data.rol !== 'Admin') { 
              listaColaboradores.push({ id: docSnap.id, ...data });
            }
          });
          setColaboradores(listaColaboradores);

        } catch (error) {
          console.error("Error buscando datos:", error);
        }
        setIsLoading(false);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!selectedArea) return; 

    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, "tareas"), where("area", "==", selectedArea));
        const querySnapshot = await getDocs(q);
        const fetchedTasks: any[] = [];
        
        querySnapshot.forEach((doc) => {
          const tarea = doc.data();
          if (tarea.estado !== 'Inactivo') {
            fetchedTasks.push(tarea);
          }
        });
        
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
    resetScore();
    setCurrentTaskIndex(0);
    setDetallesEvaluacion([]); 
    setIsFinished(false);
    setRachaAlert(null);
  }, [selectedArea, resetScore]);

  const puntosPorFalta = tasks.length > 0 ? 100 / tasks.length : 0;
  const scoreVisual = Math.round(score);

  const handleSelectEvaluado = async (colab: any) => {
    setIsChecking(true);
    try {
      const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
      const qCheck = query(collection(db, "evaluaciones"), where("evaluadoCedula", "==", colab.id), where("fechaCorta", "==", fechaSoloDia));
      const snapshot = await getDocs(qCheck);

      if (!snapshot.empty) {
        alert(`⚠️ ACCIÓN DENEGADA: El colaborador ${colab.name} ya recibió una evaluación el día de hoy.`);
      } else {
        setSelectedEvaluado(colab);
      }
    } catch (error) {
      console.error("Error validando la evaluación:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCumplio = () => {
    const nuevosDetalles = [...detallesEvaluacion, { descripcion: tasks[currentTaskIndex].descripcion, cumplio: true }];
    setDetallesEvaluacion(nuevosDetalles);
    siguientePaso(score, nuevosDetalles); 
  };

  const handleFalto = () => {
    const nuevosDetalles = [...detallesEvaluacion, { descripcion: tasks[currentTaskIndex].descripcion, cumplio: false }];
    setDetallesEvaluacion(nuevosDetalles);
    const nuevoPuntaje = score - puntosPorFalta; 
    decreaseScore(puntosPorFalta); 
    siguientePaso(nuevoPuntaje, nuevosDetalles); 
  };

  const siguientePaso = async (puntajeFinal: number, detallesFinales: any[]) => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setIsFinished(true);
      
      const puntajeFinalRedondeado = Math.round(puntajeFinal);
      const rachaActualTurno = puntajeFinalRedondeado >= 80 ? 'Positiva' : 'Negativa';

      let nuevoTipoRacha = rachaActualTurno;
      let nuevoContador = 1; 

      if (selectedEvaluado.tipoRacha === rachaActualTurno) {
        nuevoContador = (selectedEvaluado.contadorRacha || 0) + 1;
      }

      const fechaEcuador = new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil", hour12: true });
      const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });

      // NUEVO: Lógica de Alerta a los 4 turnos
      if (nuevoContador === 4) {
        const mensajePremio = nuevoTipoRacha === 'Positiva'
          ? `¡Excelente! ${selectedEvaluado.name} ha logrado una racha de 4 turnos perfectos. 🎁`
          : `¡Atención! ${selectedEvaluado.name} ha acumulado 4 evaluaciones negativas. ⚠️`;
          
        setRachaAlert(mensajePremio);
        nuevoContador = 0; 
        
        // Notificamos a la Base de Datos para que el Administrador lo vea
        try {
          await addDoc(collection(db, "notificaciones"), {
            mensaje: mensajePremio,
            fecha: fechaEcuador,
            timestamp: Date.now(),
            leido: false
          });
        } catch (err) {
          console.error("Error guardando notificación:", err);
        }
      }

      try {
        await addDoc(collection(db, "evaluaciones"), {
          evaluadorNombre: userName,
          evaluadorCedula: userCedula,
          evaluadoNombre: selectedEvaluado.name,
          evaluadoCedula: selectedEvaluado.id,
          areaEvaluada: selectedArea,
          puntajeTotal: puntajeFinalRedondeado,
          racha: rachaActualTurno,
          fecha: fechaEcuador,
          fechaCorta: fechaSoloDia, 
          detalles: detallesFinales, 
          fotosEvidencia: [], 
        });

        const evaluadoRef = doc(db, 'usuarios', selectedEvaluado.id);
        await updateDoc(evaluadoRef, { tipoRacha: nuevoTipoRacha, contadorRacha: nuevoContador });

      } catch (error) {
        console.error("Error al guardar la evaluación:", error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isLoading && !selectedEvaluado && !selectedArea) {
    return <div className="min-h-screen bg-[#8B0000] flex items-center justify-center"><p className="text-xl font-bold text-[#FFD700] animate-pulse">Cargando sistema...</p></div>;
  }

  if (hasEvaluatedToday) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">¡Evaluación Completada!</h2>
          <p className="text-md font-medium text-gray-600 mb-6">Ya realizaste tu evaluación correspondiente al turno de hoy.</p>
          <Button label="Cerrar Sesión" variant="danger" onClick={handleLogout} />
        </div>
      </div>
    );
  }

  if (!selectedEvaluado) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col p-6">
        <div className="flex justify-between items-center mb-8 text-white">
          <div className="text-lg flex flex-col">
            <div>
              <span className="font-light">Hola, </span><span className="font-extrabold">{userName}</span>
            </div>
            {/* NUEVO: Mostrar la racha propia del usuario */}
            <span className={`text-xs font-bold px-2 py-1 mt-2 rounded-full w-fit ${userTipoRacha === 'Positiva' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              Tu Racha: {userTipoRacha} ({userContadorRacha}/4)
            </span>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full h-fit">Cerrar Sesión</button>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center mx-auto mt-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paso 1: El Compañero</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {isChecking ? <p className="text-[#8B0000] font-bold animate-pulse py-4">Verificando...</p> : 
              colaboradores.map((colab) => (
                <button key={colab.id} onClick={() => handleSelectEvaluado(colab)} className="w-full text-left px-6 py-4 rounded-xl border-2 hover:border-[#8B0000] font-bold text-gray-700 flex justify-between">
                  <span>{colab.name}</span><span className="text-xs font-normal text-gray-400">CI: {colab.id}</span>
                </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedArea) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col p-6">
        <button onClick={() => setSelectedEvaluado(null)} className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full w-fit text-white mb-8">← Volver</button>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center mx-auto mt-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paso 2: El Área</h2>
          <div className="space-y-4">
            <Button label="Caja - Estrategas" variant="primary" onClick={() => setSelectedArea('Caja')} />
            <Button label="Mesas - Anfitrión" variant="primary" onClick={() => setSelectedArea('Mesas')} />
            <Button label="Elaboración - Artesanos" variant="primary" onClick={() => setSelectedArea('Elaboración')} />
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          {rachaAlert && <div className={`p-4 mb-6 rounded-xl font-bold text-white shadow-md ${rachaAlert.includes('Excelente') ? 'bg-green-600' : 'bg-red-600'}`}>{rachaAlert}</div>}
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Evaluación Enviada</h2>
          <div className={`text-6xl font-extrabold mb-6 ${scoreVisual >= 80 ? 'text-green-600' : 'text-red-600'}`}>{scoreVisual}/100</div>
          <Button label="Finalizar y Volver al Inicio" variant="primary" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#8B0000] text-[#FFD700] px-6 py-4 shadow-md rounded-b-3xl flex justify-between items-center">
        <div className="text-white font-medium flex flex-col"><span className="text-xs text-red-200">Evaluando a:</span><span className="font-bold">{selectedEvaluado.name}</span></div>
        <div className="bg-white/20 px-4 py-2 rounded-lg font-bold">Pts: {scoreVisual}</div>
      </header>
      <main className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm font-bold text-[#8B0000] bg-red-100 inline-block px-3 py-1 rounded-full">Área: {selectedArea}</p>
          <p className="text-sm font-bold text-gray-400 mt-2">Tarea {currentTaskIndex + 1} de {tasks.length}</p>
          <h2 className="text-3xl font-bold text-gray-800 leading-snug mt-2">{tasks[currentTaskIndex]?.descripcion}</h2>
        </div>
        <div className="space-y-4 mt-auto mb-8">
          <Button label="SÍ CUMPLIÓ" variant="success" icon="✅" onClick={handleCumplio} />
          <Button label="FALTÓ (Evidencia Omitida)" variant="danger" icon="❌" onClick={handleFalto} />
        </div>
      </main>
    </div>
  );
}