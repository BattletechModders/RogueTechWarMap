
const baseUrl:string = import.meta.env.VITE_API_URL;

const API_BASE_URL = baseUrl? baseUrl : 'https://roguewar.org';

export { API_BASE_URL };
