import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

import { MemoryRouter } from 'react-router-dom';

describe('App Component', () => {
  it('renders without crashing and shows ALOEFLORA text', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const brandingElements = screen.getAllByText(/ALOEFLORA/i);
    expect(brandingElements.length).toBeGreaterThan(0);
  });
});
