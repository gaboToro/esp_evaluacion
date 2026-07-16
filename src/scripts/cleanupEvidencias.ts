import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Función auxiliar: Solo inicializa Firebase cuando se manda a llamar, NO durante el build
function getAdminDb() {
  if (!getApps().length) {
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      const filePath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        throw new Error('No se encontró FIREBASE_SERVICE_ACCOUNT ni el archivo serviceAccountKey.json local');
      }
    }

    initializeApp({ 
      credential: cert(serviceAccount) 
    });
  }
  return getFirestore();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

async function limpiarEvidenciasAntiguas() {
  const db = getAdminDb(); // Se conecta a Firestore recién aquí adentro
  const haceDosMeses = new Date();
  haceDosMeses.setMonth(haceDosMeses.getMonth() - 2);

  console.log(`\n--- INICIANDO LIMPIEZA ---`);
  console.log(`Fecha límite: ${haceDosMeses.toISOString()}`);

  const snapshot = await db.collection('evaluaciones').get();
  console.log(`Se encontraron ${snapshot.size} evaluaciones en la base de datos.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\nRevisando documento ID: ${doc.id}`);

    if (!data.fechaTimestamp || typeof data.fechaTimestamp.toDate !== 'function') {
      console.log(`  -> SALTADO: 'fechaTimestamp' no válido o inexistente.`);
      continue;
    }

    const fechaEvaluacion = data.fechaTimestamp.toDate(); 
    console.log(`  -> Fecha de la evaluación: ${fechaEvaluacion.toISOString()}`);

    if (fechaEvaluacion < haceDosMeses) {
      console.log(`  -> ¡CUMPLE LA CONDICIÓN! Procediendo a borrar evidencias...`);
      
      const fotos: string[] = data.fotosEvidencia || [];
      const detalles: any[] = data.detalles || [];
      const urlsParaBorrar: string[] = [];

      fotos.forEach(url => { if (url) urlsParaBorrar.push(url); });

      const detallesActualizados = detalles.map(detalle => {
        if (detalle.evidenciaUrl) {
          urlsParaBorrar.push(detalle.evidenciaUrl);
          return { ...detalle, evidenciaUrl: null };
        }
        return detalle;
      });

      for (const url of urlsParaBorrar) {
        const fileName = url.split('/').pop()?.split('?')[0]; 
        if (fileName) {
          console.log(`  -> Intentando borrar de Supabase: ${fileName}`);
          await supabase.storage.from('evidencias').remove([fileName]);
        }
      }

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