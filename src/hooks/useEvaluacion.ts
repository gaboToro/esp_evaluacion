import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useEvaluationStore } from '../store/evaluationStore';
import * as dbService from '../services/databaseService';

export const useEvaluacion = () => {
  const { score, decreaseScore, resetScore } = useEvaluationStore();
  const router = useRouter();

  const [userName, setUserName] = useState<string>('');
  const [userCedula, setUserCedula] = useState<string>('');
  const [userTipoRacha, setUserTipoRacha] = useState<string>('Positiva');
  const [userContadorRacha, setUserContadorRacha] = useState<number>(0);

  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selectedEvaluado, setSelectedEvaluado] = useState<any | null>(null);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [detallesEvaluacion, setDetallesEvaluacion] = useState<{ descripcion: string, cumplio: boolean, evidenciaUrl?: string | null }[]>([]);

  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [rachaAlert, setRachaAlert] = useState<string | null>(null);
  const [hasEvaluatedToday, setHasEvaluatedToday] = useState(false);

  // 1. Cargar datos base y restaurar selecciones de SessionStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const cedula = user.email.split('@')[0];
        setUserCedula(cedula);
        try {
          const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
          const yaEvaluo = await dbService.verificarSiYaEvaluoHoy("evaluadorCedula", cedula, fechaSoloDia);
          if (yaEvaluo) setHasEvaluatedToday(true);

          const userData: any = await dbService.getUsuarioPorCedula(cedula);
          if (userData) {
            setUserName(userData.name || `Cédula: ${cedula}`);
            setUserTipoRacha(userData.tipoRacha || 'Positiva');
            setUserContadorRacha(userData.contadorRacha || 0);
          }

          const todosUsuarios = await dbService.getTodosLosUsuarios();
          setColaboradores(todosUsuarios.filter(u => u.id !== cedula && u.rol !== 'Admin'));

          // RECUPERACIÓN DE BORRADOR INICIAL
          const draftStr = sessionStorage.getItem('eval_draft');
          if (draftStr) {
            const draft = JSON.parse(draftStr);
            if (draft.fecha === fechaSoloDia) {
              if (draft.selectedEvaluado) setSelectedEvaluado(draft.selectedEvaluado);
              if (draft.selectedArea) setSelectedArea(draft.selectedArea);
            } else {
              sessionStorage.removeItem('eval_draft');
            }
          }

        } catch (error) { console.error("Error:", error); }
        setIsLoading(false);
      } else {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Cargar tareas y restaurar progreso de tareas
  useEffect(() => {
    if (!selectedArea) return;
    const fetchTasks = async () => {
      setIsLoading(true);
      const fetchedTasks = await dbService.getTareasActivasPorArea(selectedArea);
      setTasks(fetchedTasks);

      // RECUPERACIÓN DE PROGRESO DE TAREAS
      const draftStr = sessionStorage.getItem('eval_draft');
      const draft = draftStr ? JSON.parse(draftStr) : null;

      if (draft && draft.selectedArea === selectedArea) {
        setCurrentTaskIndex(draft.currentTaskIndex);
        setDetallesEvaluacion(draft.detallesEvaluacion);
        // Sincronizar el estado global del score restando lo necesario
        resetScore();
        if (draft.score < 100) decreaseScore(100 - draft.score);
      } else {
        resetScore();
        setCurrentTaskIndex(0);
        setDetallesEvaluacion([]);
      }

      setIsLoading(false);
    };
    fetchTasks();
    setIsFinished(false);
    setRachaAlert(null);
  }, [selectedArea, resetScore, decreaseScore]);

  // 3. Autoguardado constante
  useEffect(() => {
    if (isFinished || !selectedEvaluado) return;
    const draft = {
      fecha: new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" }),
      selectedEvaluado,
      selectedArea,
      currentTaskIndex,
      detallesEvaluacion,
      score: Math.round(score)
    };
    sessionStorage.setItem('eval_draft', JSON.stringify(draft));
  }, [selectedEvaluado, selectedArea, currentTaskIndex, detallesEvaluacion, score, isFinished]);

  const puntosPorFalta = tasks.length > 0 ? 100 / tasks.length : 0;
  const scoreVisual = Math.round(score);

  const handleSelectEvaluado = async (colab: any) => {
    setIsChecking(true);
    const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
    const yaFueEvaluado = await dbService.verificarSiYaEvaluoHoy("evaluadoCedula", colab.id, fechaSoloDia);
    if (yaFueEvaluado) alert(`⚠️ El colaborador ${colab.name} ya fue evaluado hoy.`);
    else setSelectedEvaluado(colab);
    setIsChecking(false);
  };

  const handleCumplio = () => {
    const nuevosDetalles = [...detallesEvaluacion, { descripcion: tasks[currentTaskIndex].descripcion, cumplio: true, evidenciaUrl: null }];
    setDetallesEvaluacion(nuevosDetalles);
    siguientePaso(score, nuevosDetalles);
  };

  const handleFalto = (urlEvidencia?: string) => {
    const nuevosDetalles = [...detallesEvaluacion, {
      descripcion: tasks[currentTaskIndex].descripcion,
      cumplio: false,
      evidenciaUrl: urlEvidencia || null
    }];
    setDetallesEvaluacion(nuevosDetalles);
    decreaseScore(puntosPorFalta);
    siguientePaso(score - puntosPorFalta, nuevosDetalles);
  };

  const siguientePaso = async (puntajeFinal: number, detallesFinales: any[]) => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setIsFinished(true);
      sessionStorage.removeItem('eval_draft'); // Se elimina el borrador al culminar

      const puntajeFinalRedondeado = Math.round(puntajeFinal);
      const rachaActualTurno = puntajeFinalRedondeado >= 80 ? 'Positiva' : 'Negativa';

      let nuevoTipoRacha = rachaActualTurno;
      let nuevoContador = (selectedEvaluado.tipoRacha === rachaActualTurno) ? (selectedEvaluado.contadorRacha || 0) + 1 : 1;

      const fechaEcuador = new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil", hour12: true });
      const fechaSoloDia = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });

      if (nuevoContador === 4) {
        const mensajePremio = nuevoTipoRacha === 'Positiva'
          ? `¡Excelente! ${selectedEvaluado.name} ha logrado una racha de 4 turnos perfectos. 🎁`
          : `¡Atención! ${selectedEvaluado.name} ha acumulado 4 evaluaciones negativas. ⚠️`;
        setRachaAlert(mensajePremio);
        nuevoContador = 0;
        await dbService.crearNotificacion({ mensaje: mensajePremio, fecha: fechaEcuador, timestamp: Date.now(), leido: false });
      }

      const arrayFotosEvidencia = detallesFinales.map(detalle => detalle.evidenciaUrl).filter(url => url !== null);

      await dbService.guardarEvaluacion({
        evaluadorNombre: userName, evaluadorCedula: userCedula,
        evaluadoNombre: selectedEvaluado.name, evaluadoCedula: selectedEvaluado.id,
        areaEvaluada: selectedArea, puntajeTotal: puntajeFinalRedondeado,
        racha: rachaActualTurno, fecha: fechaEcuador, fechaCorta: fechaSoloDia,
        detalles: detallesFinales, fotosEvidencia: arrayFotosEvidencia,
      });
      await dbService.actualizarRachaUsuario(selectedEvaluado.id, nuevoTipoRacha, nuevoContador);
    }
  };

  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  return {
    userName, userTipoRacha, userContadorRacha, colaboradores, selectedEvaluado, setSelectedEvaluado,
    selectedArea, setSelectedArea, tasks, currentTaskIndex, isFinished, isLoading, isChecking,
    rachaAlert, hasEvaluatedToday, scoreVisual, handleSelectEvaluado, handleCumplio, handleFalto, handleLogout
  };
};