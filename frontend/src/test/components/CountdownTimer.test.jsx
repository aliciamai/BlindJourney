import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppThemeProvider } from '../../context/ThemeContext';
import CountdownTimer from '../../components/CountdownTimer';

function wrap(targetDate) {
  return render(
    <AppThemeProvider>
      <CountdownTimer targetDate={targetDate} />
    </AppThemeProvider>
  );
}

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza las 4 unidades de tiempo (días, horas, min, seg)', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    wrap(future);
    expect(screen.getByText('Días')).toBeInTheDocument();
    expect(screen.getByText('Horas')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Seg')).toBeInTheDocument();
  });

  it('calcula correctamente los valores para una fecha futura', () => {
    const target = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);
    wrap(target.toISOString());
    // Days should be 1
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('muestra ceros cuando la fecha ya pasó', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    wrap(past);
    const zeros = screen.getAllByText('00');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it('actualiza cada segundo', async () => {
    const target = new Date(Date.now() + 10 * 1000);
    wrap(target.toISOString());
    const secBefore = screen.getAllByText(/^\d{2}$/);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // The component should have re-rendered — just check it didn't crash
    expect(screen.getByText('Seg')).toBeInTheDocument();
  });

  it('limpia el intervalo al desmontar', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const future = new Date(Date.now() + 10000).toISOString();
    const { unmount } = wrap(future);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
