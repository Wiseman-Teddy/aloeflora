import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing and shows ALOEFLORA text', () => {
    render(<App />);
    const brandingElements = screen.getAllByText(/ALOEFLORA/i);
    expect(brandingElements.length).toBeGreaterThan(0);
  });
});
