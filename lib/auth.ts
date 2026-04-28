import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'rifasonfire_access_token';
const REFRESH_TOKEN_KEY = 'rifasonfire_refresh_token';
const USER_DATA_KEY = 'rifasonfire_user';

export interface User {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ORGANIZADOR';
}

export const saveAuthData = (accessToken: string, refreshToken: string, user: User) => {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 1/96 }); // 15 mins (approx)
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 });  // 7 days
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const getAccessToken = () => Cookies.get(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY);

export const getUserData = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearAuthData = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

export const isAuthenticated = () => !!getAccessToken();
