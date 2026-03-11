import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Map } from './components/pages/';
// Keep this import commented until the legacy home route is restored.
// import { Home, Map } from './components/pages/';
import ErrorPage from './components/pages/Error';
import { BASE_ROUTE } from './components/helpers/RouteHelper.ts';
// Kept for later route re-introduction when the Terms-of-Service view is restored.
// import { ToS } from './components/pages/ToS';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Map />} errorElement={<ErrorPage />} />

      <Route index element={<Map />} />
      {/* Parking legacy routes while main route handling is stabilized. */}
      {/* <Route path="/map" element={<Map />} /> */}
      {/* <Route path="/tos" element={<ToS />} /> */}
    </>
  ), {basename: BASE_ROUTE}
);

export default function App() {
  return (
    <RouterProvider
      router={router}
      // Uncomment this with <Fallback /> when adding a shared app-wide fallback screen.
      // fallbackElement={<Fallback />}
    />
  );
}
