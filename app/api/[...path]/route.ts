import { NextRequest, NextResponse } from 'next/server';

const PROXY_BACKEND_URL = `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api`;

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const searchParams = request.nextUrl.search;

  const targetUrl = `${PROXY_BACKEND_URL}/${pathString}${searchParams}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  try {
    let body: any = null;

    if (!['GET', 'HEAD'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        body = await request.arrayBuffer();
      }
    }

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-ignore - required for stream/formData bodies in Node fetch
      duplex: 'half',
    });

    const responseData = await backendResponse.arrayBuffer();

    const finalHeaders = new Headers(backendResponse.headers);
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

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
