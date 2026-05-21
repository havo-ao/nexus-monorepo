import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from './SignUp';
import * as countriesModule from '../utils/countries';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  registerTrader: vi.fn()
}));

vi.mock('../auth/storage', () => ({
  persistAuthSession: vi.fn(),
  getStoredUser: vi.fn(() => null),
  SESSION_CHANGE_EVENT: 'nexus_session_change'
}));

const fetchCountryOptionsMock = vi.spyOn(countriesModule, 'fetchCountryOptions');

describe('SignUp page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the signup form and loads country options', async () => {
    fetchCountryOptionsMock.mockResolvedValue([
      { code: 'US', name: 'United States', dialCode: '+1' }
    ] as any);

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignUp />
      </MemoryRouter>
    );

    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchCountryOptionsMock).toHaveBeenCalled();
    });
  });

  it('renders the submit button once the form is loaded', async () => {
    fetchCountryOptionsMock.mockResolvedValue([] as any);

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignUp />
      </MemoryRouter>
    );

    const submitButton = await screen.findByText(/Create Trader account/i);
    expect(submitButton).toBeInTheDocument();
  });
});
