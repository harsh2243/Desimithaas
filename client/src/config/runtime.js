const rawBackendUrl = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.BACKEND_URL ||
  ''
).trim();

export const backendUrl = rawBackendUrl ? rawBackendUrl.replace(/\/$/, '') : '';

export const apiBaseUrl = backendUrl ? `${backendUrl}/api` : '/api';

export const razorpayKeyId = (
  import.meta.env.VITE_RAZORPAY_KEY_ID ||
  import.meta.env.RZP_ID ||
  ''
).trim();
