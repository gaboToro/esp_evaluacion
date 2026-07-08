'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
// Importamos updateDoc para modificar el perfil del usuario
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { db, auth } from '../../lib/firebase';
import { useEvaluationStore } from '../../store/evaluationStore';
import { Button } from '../../components/atoms/Button';

export default function EvaluacionPage() {
  const { score, decreaseScore, resetScore } = useEvaluationStore();
  const router = useRouter();
  
  // Estados del Usuario incluyendo el control de rachas
  const [userName, setUserName] = useState<string>('');
  const [userCedula, setUserCedula] = useState<string>('');
  const [userRol, setUserRol] = useState<string>(''); 
  const [userTipoRacha, setUserTipoRacha] = useState<string>('');
  const [userContadorRacha, setUserContadorRacha] = useState<number>(0);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para la alerta visual de Premio o Sanción
  const [rachaAlert, setRachaAlert] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const cedula = user.email.split('@')[0];
        setUserCedula(cedula);

        try {
          const userDocRef = doc(db, 'usuarios', cedula);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserName(userData.name || `Cédula: ${cedula}`);
            setUserRol(userData.rol || 'Operario');
            // Cargamos la racha actual del usuario desde la base de datos
            setUserTipoRacha(userData.tipoRacha || '');
            setUserContadorRacha(userData.contadorRacha || 0);
          } else {
            setUserName(`Cédula: ${cedula}`);
          }
        } catch (error) {
          console.error("Error buscando usuario:", error);
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
        querySnapshot.forEach((doc) => fetchedTasks.push(doc.data()));
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
    setIsFinished(false);
    setRachaAlert(null); // Limpiamos alertas previas
  }, [selectedArea, resetScore]);

  const puntosPorFalta = tasks.length > 0 ? 100 / tasks.length : 0;
  const scoreVisual = Math.round(score);

  const handleCumplio = () => {
    siguientePaso(score); 
  };

  const handleFalto = () => {
    const nuevoPuntaje = score - puntosPorFalta; 
    decreaseScore(puntosPorFalta); 
    siguientePaso(nuevoPuntaje); 
  };

  const siguientePaso = async (puntajeFinal: number) => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setIsFinished(true);
      
      const puntajeFinalRedondeado = Math.round(puntajeFinal);
      const rachaActualTurno = puntajeFinalRedondeado >= 80 ? 'Positiva' : 'Negativa';

      // --- LÓGICA DE CONTROL DE RACHAS ---
      let nuevoTipoRacha = rachaActualTurno;
      let nuevoContador = 1; // Si la racha se rompe, empieza en 1

      // Si mantiene el mismo tipo de racha, el contador sube
      if (userTipoRacha === rachaActualTurno) {
        nuevoContador = userContadorRacha + 1;
      }

      // Verificamos si llegó a la meta de 4
      if (nuevoContador === 4) {
        if (nuevoTipoRacha === 'Positiva') {
          setRachaAlert("¡Felicidades! Has logrado una racha de 4 turnos perfectos. ¡Premio desbloqueado! 🎁");
        } else {
          setRachaAlert("¡Atención! Has acumulado 4 evaluaciones negativas consecutivas. Alerta de sanción disciplinaria. ⚠️");
        }
        nuevoContador = 0; // Reiniciamos el ciclo
      }

      // Fecha con zona horaria de Ecuador
      const fechaEcuador = new Date().toLocaleString("es-EC", {
        timeZone: "America/Guayaquil",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: true 
      });

      try {
        // 1. Guardamos el historial de la evaluación
        await addDoc(collection(db, "evaluaciones"), {
          evaluadorNombre: userName,
          evaluadorCedula: userCedula,
          areaEvaluada: selectedArea,
          puntajeTotal: puntajeFinalRedondeado,
          racha: rachaActualTurno,
          fecha: fechaEcuador,
        });

        // 2. Actualizamos el perfil del usuario con su nuevo contador
        const userRef = doc(db, 'usuarios', userCedula);
        await updateDoc(userRef, {
          tipoRacha: nuevoTipoRacha,
          contadorRacha: nuevoContador
        });

        // Actualizamos la memoria temporal por si el usuario hace otra evaluación en la misma sesión
        setUserTipoRacha(nuevoTipoRacha);
        setUserContadorRacha(nuevoContador);

      } catch (error) {
        console.error("Error al guardar la evaluación y la racha:", error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  // ... (Pantallas de Carga y Selección de Área se mantienen igual)
  if (isLoading && !selectedArea) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-[#FFD700] animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  if (!selectedArea) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col p-6">
        <div className="flex justify-between items-center mb-8 text-white">
          <div className="text-lg flex flex-col">
            <div>
              <span className="font-light">Hola, </span>
              <span className="font-extrabold">{userName}</span>
            </div>
            <span className="text-sm font-medium text-red-200">{userRol}</span>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors">
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center mx-auto mt-4">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo El Español" width={100} height={100} className="object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Selecciona el Área</h2>
          <p className="text-gray-600 font-medium mb-8">¿Qué área vas a evaluar hoy?</p>
          <div className="space-y-4">
            <Button label="Caja - Estrategas" variant="primary" onClick={() => setSelectedArea('Caja')} />
            <Button label="Mesas - Anfitrión" variant="primary" onClick={() => setSelectedArea('Mesas')} />
            <Button label="Elaboración - Artesanos" variant="primary" onClick={() => setSelectedArea('Elaboración')} />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-[#FFD700] animate-pulse">Cargando tareas...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo El Español" width={80} height={80} className="object-contain" />
          </div>
          
          {/* AQUÍ ESTÁ LA NUEVA ALERTA DE PREMIOS/SANCIONES */}
          {rachaAlert && (
            <div className={`p-4 mb-6 rounded-xl font-bold text-white shadow-md ${rachaAlert.includes('Felicidades') ? 'bg-green-600' : 'bg-red-600'}`}>
              {rachaAlert}
            </div>
          )}

          <h2 className="text-3xl font-bold mb-4 text-gray-800">Evaluación Terminada</h2>
          <p className="text-xl font-bold text-[#8B0000] mb-2">Área: {selectedArea}</p>
          <div className={`text-6xl font-extrabold mb-6 ${scoreVisual >= 80 ? 'text-green-600' : 'text-red-600'}`}>
            {scoreVisual}/100
          </div>
          <p className="text-lg font-medium text-gray-600 mb-8">
            Racha Actual: {scoreVisual >= 80 ? '🔥 Positiva' : '📉 Negativa'}
          </p>
          <Button label="Finalizar y Volver" variant="primary" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#8B0000] text-[#FFD700] px-6 py-4 shadow-md rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div className="bg-white/10 p-1 rounded-lg">
             <Image src="/logo.png" alt="Logo El Español" width={80} height={40} className="object-contain" />
          </div>
          <button onClick={handleLogout} className="text-sm font-bold text-white underline hover:text-gray-200">
            Cerrar Sesión
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-white font-medium flex flex-col">
            <span>Evaluador: <span className="font-bold">{userName}</span></span>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg font-bold">Pts: {scoreVisual}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm font-bold text-[#8B0000] mb-2 uppercase tracking-wide bg-red-100 inline-block px-3 py-1 rounded-full">
            Área: {selectedArea}
          </p>
          <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide block mt-2">
            Tarea {currentTaskIndex + 1} de {tasks.length}
          </p>
          <h2 className="text-3xl font-bold text-gray-800 leading-snug">
            {tasks[currentTaskIndex]?.descripcion}
          </h2>
        </div>

        <div className="space-y-4 mt-auto mb-8">
          <Button label="SÍ CUMPLIÓ" variant="success" icon="✅" onClick={handleCumplio} />
          <Button label="FALTÓ (Requiere Foto)" variant="danger" icon="❌" onClick={handleFalto} />
        </div>
      </main>
    </div>
  );
}