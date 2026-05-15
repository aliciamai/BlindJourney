import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LogoHeader from '../../components/LogoHeader';

describe('LogoHeader', () => {
  it('renderiza el texto BlindJourney', () => {
    render(<LogoHeader />);
    expect(screen.getByText('BlindJourney')).toBeInTheDocument();
  });

  it('muestra tagline por defecto', () => {
    render(<LogoHeader />);
    expect(screen.getByText('Tu próxima aventura es un misterio')).toBeInTheDocument();
  });

  it('muestra tagline personalizado', () => {
    render(<LogoHeader tagline="Tagline personalizado" />);
    expect(screen.getByText('Tagline personalizado')).toBeInTheDocument();
  });

  it('no muestra tagline cuando se pasa cadena vacía', () => {
    render(<LogoHeader tagline="" />);
    expect(screen.queryByText('Tu próxima aventura es un misterio')).not.toBeInTheDocument();
  });
});
