let baseRoute = import.meta.env.VITE_BASE_URL as string;

const BASE_ROUTE = baseRoute? baseRoute : '/';

export { BASE_ROUTE };
