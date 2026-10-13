const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:4000').replace(/\/+$/, '');
