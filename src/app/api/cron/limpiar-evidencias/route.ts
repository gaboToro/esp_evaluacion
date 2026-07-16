import { NextResponse } from 'next/server';
import { limpiarEvidenciasAntiguas } from '@/scripts/cleanupEvidencias'; // Ajusta la ruta si es necesario

export async function GET(request: Request) {
  try {
    // Vercel Cron envía un header específico, esto es opcional pero recomendado por seguridad
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await limpiarEvidenciasAntiguas();
    
    return NextResponse.json({ success: true, message: 'Limpieza ejecutada correctamente' });
  } catch (error: any) {
    console.error('Error ejecutando cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}