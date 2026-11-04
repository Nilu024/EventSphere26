import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleProtectedRoute from './RoleProtectedRoute';

const auth = vi.hoisted(() => ({ value: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth.value }));

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/participant/dashboard" element={<p>participant home</p>} />
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleProtectedRoute allow={['organizer']} />}><Route path="/organizer/dashboard" element={<p>organizer area</p>} /></Route>
      </Route>
    </Routes>
  </MemoryRouter>,
);

describe('route protection', () => {
  it('redirects anonymous users to /login', () => { auth.value = { loading: false, isAuthenticated: false }; renderAt('/organizer/dashboard'); expect(screen.getByText('login page')).toBeInTheDocument(); });
  it('sends the wrong role to its own dashboard', () => { auth.value = { loading: false, isAuthenticated: true, role: 'participant' }; renderAt('/organizer/dashboard'); expect(screen.getByText('participant home')).toBeInTheDocument(); });
  it('allows the right role', () => { auth.value = { loading: false, isAuthenticated: true, role: 'organizer' }; renderAt('/organizer/dashboard'); expect(screen.getByText('organizer area')).toBeInTheDocument(); });
});
