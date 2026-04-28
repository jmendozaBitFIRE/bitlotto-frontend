export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 
  (process.env.NODE_ENV === 'production' 
    ? 'https://bitlotto-backend-production.up.railway.app/api' 
    : 'http://localhost:4000/api');

export const BACKEND_URL = API_URL.replace('/api', '');
