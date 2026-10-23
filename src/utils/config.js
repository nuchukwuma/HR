const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_SERVER_URL = configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
