import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Map } from './components/pages/';
// import { Home, Map } from './components/pages/';
import ErrorPage from './components/pages/Error';
import { BASE_ROUTE } from './components/helpers/RouteHelper.ts';
// import { ToS } from './components/pages/ToS';

const router = createBrowserRouter([
  createRoutesFromElements(
    <>
      <Route path="/" element={<Map />} errorElement={<ErrorPage />} />

      <Route index element={<Map />} />
      {/* <Route path="/map" element={<Map />} /> */}
      {/* <Route path="/tos" element={<ToS />} /> */}
    </>
  )], {basename: BASE_ROUTE}
);

export default function App() {
  return (
    <RouterProvider
      router={router}
      // fallbackElement={<Fallback /> }
    />
  );
}
