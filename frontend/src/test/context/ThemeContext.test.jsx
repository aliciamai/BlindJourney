import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppThemeProvider, useThemeMode } from '../../context/ThemeContext';

function ThemeConsumer() {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('modo por defecto es dark cuando no hay localStorage', () => {
    render(<AppThemeProvider><ThemeConsumer /></AppThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('carga modo desde bj_theme en localStorage', () => {
    localStorage.setItem('bj_theme', 'light');
    render(<AppThemeProvider><ThemeConsumer /></AppThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggleTheme cambia de dark a light', async () => {
    const user = userEvent.setup();
    render(<AppThemeProvider><ThemeConsumer /></AppThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    await act(async () => {
      await user.click(screen.getByText('Toggle'));
    });
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(localStorage.getItem('bj_theme')).toBe('light');
  });

  it('toggleTheme cambia de light a dark', async () => {
    localStorage.setItem('bj_theme', 'light');
    const user = userEvent.setup();
    render(<AppThemeProvider><ThemeConsumer /></AppThemeProvider>);
    await act(async () => {
      await user.click(screen.getByText('Toggle'));
    });
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(localStorage.getItem('bj_theme')).toBe('dark');
  });
});
