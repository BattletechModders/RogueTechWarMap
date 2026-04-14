import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Map } from './components/pages/';
import ErrorPage from './components/pages/Error';
import { BASE_ROUTE } from './components/helpers/RouteHelper.ts';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Map />} errorElement={<ErrorPage />} />
      <Route index element={<Map />} />
    </>
  ), {basename: BASE_ROUTE}
);

export default function App() {
  return (
    <RouterProvider router={router} />
  );
}
