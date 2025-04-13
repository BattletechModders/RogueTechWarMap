
let baseUrl = import.meta.env.VITE_API_URL as string;

const API_BASE_URL = baseUrl? baseUrl : 'https://roguewar.org';

export { API_BASE_URL };
