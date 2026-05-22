// Central backend config for admin frontend.
// Defaults to local Docker backend, but can be overridden for deployment builds.
export const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || "http://127.0.0.1:8000";
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;
