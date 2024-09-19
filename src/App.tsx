import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import './App.css';
import { Home, Map } from './components/pages/';
import ErrorPage from './components/pages/Error';
import { ToS } from './components/pages/ToS';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} errorElement={<ErrorPage />} />

      <Route index element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/tos" element={<ToS />} />
    </>
  )
);

export default function App() {
  return (
    <RouterProvider
      router={router}
      // fallbackElement={<Fallback /> }
    />
  );
}
