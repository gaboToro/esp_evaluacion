import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';

// Inicialización inteligente para local y producción (Vercel)
if (!getApps().length) {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // En Vercel: lee desde la variable de entorno
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // En local: lee desde el archivo físico
    serviceAccount = require('../../serviceAccountKey.json');
  }

  initializeApp({ 
    credential: cert(serviceAccount) 
  });
}

const db = getFirestore();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function limpiarEvidenciasAntiguas() {
  const haceDosMeses = new Date();
  haceDosMeses.setMonth(haceDosMeses.getMonth() - 2);
  
  console.log(`\n--- INICIANDO LIMPIEZA ---`);
  console.log(`Fecha límite (todo lo anterior a esto se borrará): ${haceDosMeses.toISOString()}`);

  const snapshot = await db.collection('evaluaciones').get();
  console.log(`Se encontraron ${snapshot.size} evaluaciones en la base de datos.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\nRevisando documento ID: ${doc.id}`);

    if (!data.fechaTimestamp) {
      console.log(`  -> SALTADO: El documento no tiene el campo 'fechaTimestamp'.`);
      continue;
    }

    // Validar si es un Timestamp de Firebase (debe tener el método toDate)
    if (typeof data.fechaTimestamp.toDate !== 'function') {
      console.log(`  -> SALTADO: 'fechaTimestamp' no es un Timestamp válido. Tipo actual: ${typeof data.fechaTimestamp}`);
      continue;
    }

    const fechaEvaluacion = data.fechaTimestamp.toDate(); 
    console.log(`  -> Fecha de la evaluación: ${fechaEvaluacion.toISOString()}`);

    if (fechaEvaluacion < haceDosMeses) {
      console.log(`  -> ¡CUMPLE LA CONDICIÓN! Procediendo a borrar evidencias...`);
      
      const fotos: string[] = data.fotosEvidencia || [];
      const detalles: any[] = data.detalles || [];
      const urlsParaBorrar: string[] = [];

      // 1. Recolectar URLs del arreglo general
      fotos.forEach(url => {
        if (url) urlsParaBorrar.push(url);
      });

      // 2. Recolectar URLs de los detalles y preparar el nuevo arreglo sin URLs
      const detallesActualizados = detalles.map(detalle => {
        if (detalle.evidenciaUrl) {
          urlsParaBorrar.push(detalle.evidenciaUrl);
          return { ...detalle, evidenciaUrl: null }; // Dejamos la URL en null
        }
        return detalle;
      });

      if (urlsParaBorrar.length === 0) {
        console.log(`  -> No hay fotos para borrar en este documento.`);
      }

      // 3. Borrar todas las URLs recolectadas de Supabase
      for (const url of urlsParaBorrar) {
        const fileName = url.split('/').pop()?.split('?')[0]; 
        if (fileName) {
          console.log(`  -> Intentando borrar de Supabase: ${fileName}`);
          const { error } = await supabase.storage.from('evidencias').remove([fileName]);
          if (error) {
            console.error(`  -> ERROR borrando en Supabase:`, error);
          } else {
            console.log(`  -> Archivo ${fileName} borrado exitosamente.`);
          }
        }
      }

      // 4. Actualizar Firebase: vaciar arreglo general y actualizar detalles
      await doc.ref.update({ 
        fotosEvidencia: [],
        detalles: detallesActualizados
      });
      console.log(`  -> Referencias eliminadas en Firebase para el documento ${doc.id}.`);
    } else {
      console.log(`  -> SALTADO: La evaluación es muy reciente.`);
    }
  }
  
  console.log(`\n--- FIN DE LA LIMPIEZA ---`);
}

export { limpiarEvidenciasAntiguas };