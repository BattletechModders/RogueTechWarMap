import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import ErrorPage from './Error';

const renderWithError = (routeError: unknown) => {
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <div>ok</div>,
      errorElement: <ErrorPage />,
      loader: () => {
        throw routeError;
      },
    },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  return render(<RouterProvider router={router} />);
};

describe('ErrorPage', () => {
  it('renders the route-error-response branch (Response thrown)', async () => {
    renderWithError(new Response(null, { status: 404 }));
    // Loader rejects → ErrorPage mounts → isRouteErrorResponse branch
    expect(
      await screen.findByText(/contact Rogue War on the\s*Discord Server/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Click here to return Home/i)).toBeInTheDocument();
  });

  it('renders the generic Error branch with the error message', async () => {
    renderWithError(new Error('kapow'));
    expect(await screen.findByText(/Oops! Unexpected Error/i)).toBeInTheDocument();
    expect(screen.getByText('kapow')).toBeInTheDocument();
  });

  it('renders the "Unknown error" branch for non-Error, non-Response throws', async () => {
    renderWithError('just a string');
    expect(await screen.findByText(/Unknown error/i)).toBeInTheDocument();
  });

  it('wraps the error content in the PageTemplate (SideMenu visible)', async () => {
    renderWithError(new Error('x'));
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });
});
