import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy dinámico para reenviar peticiones desde el frontend Next.js 
 * hacia el backend NestJS, evitando problemas de CORS y URLs hardcodeadas.
 */

import { BACKEND_URL } from '@/lib/constants';

const PROXY_BACKEND_URL = `${BACKEND_URL}/api`;

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const searchParams = request.nextUrl.search;
  
  // Construir la URL final del backend
  const targetUrl = `${PROXY_BACKEND_URL}/${pathString}${searchParams}`;

  // Clonar headers y limpiar los que Next.js o el navegador puedan interferir
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  try {
    let body: any = null;

    // Solo leer el body si el método no es GET o HEAD
    if (!['GET', 'HEAD'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType.includes('multipart/form-data')) {
        // Para uploads, pasamos el formData directamente
        body = await request.formData();
      } else {
        // Fallback para otros tipos
        body = await request.arrayBuffer();
      }
    }

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore - duplex es necesario para cuerpos de tipo stream/formData en fetch de Node/Next
      duplex: 'half', 
    });

    // Obtener el cuerpo de la respuesta del backend
    const responseData = await backendResponse.arrayBuffer();

    // Reenviar la respuesta al cliente manteniendo status y headers básicos
    const finalHeaders = new Headers(backendResponse.headers);
    // Eliminar headers de encoding que puedan causar problemas con Next.js
    finalHeaders.delete('content-encoding');
    finalHeaders.delete('transfer-encoding');

    return new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: finalHeaders,
    });

  } catch (error: any) {
    console.error(`Proxy Error [${request.method}] ${targetUrl}:`, error);
    
    return NextResponse.json(
      { message: 'Error de conexión con el servidor backend', error: error.message },
      { status: 502 }
    );
  }
}

// Exportar los manejadores para todos los métodos HTTP
export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
