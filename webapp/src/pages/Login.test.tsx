import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import Login from './Login';
import * as authApi from '../api/auth';

vi.mock('../api/auth', () => ({
  login: vi.fn()
}));

vi.mock('../auth/storage', () => ({
  persistAuthSession: vi.fn(),
  getStoredUser: vi.fn(() => null),
  SESSION_CHANGE_EVENT: 'nexus_session_change'
}));

const mockedLogin = vi.mocked(authApi.login);

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a registration banner when location state includes registered', () => {
    const history = createMemoryHistory({
      initialEntries: [{ pathname: '/login', state: { registered: true } }]
    });

    render(
      <Router history={history}>
        <Route path="/login">
          <Login />
        </Route>
      </Router>
    );

    expect(screen.getByText(/Account created/i)).toBeInTheDocument();
  });

  it('calls login and redirects to dashboard for a trader role', async () => {
    mockedLogin.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        name: 'Test',
        surname: 'User',
        email: 'user@example.com',
        username: 'testuser',
        userRol: 'TRADER'
      }
    });
    const history = createMemoryHistory({ initialEntries: ['/login'] });

    const { container } = render(
      <Router history={history}>
        <Route path="/login">
          <Login />
        </Route>
      </Router>
    );

    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('********');
    const submitButton = screen.getByRole('button', { name: /log in/i });
    const form = container.querySelector('form');

    const emailIonInput = emailInput.closest('ion-input') ?? emailInput;
    const passwordIonInput = passwordInput.closest('ion-input') ?? passwordInput;

    fireEvent(emailIonInput, new CustomEvent('ionInput', {
      detail: { value: 'user@example.com' },
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    fireEvent(passwordIonInput, new CustomEvent('ionInput', {
      detail: { value: 'Password123!' },
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    fireEvent.click(submitButton);

    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!'
      });
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe('/dashboard');
    });
  });
});
