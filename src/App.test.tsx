import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders grid', () => {
  render(<App />);
  const gridElement = screen.getByRole('table');
  expect(gridElement).toBeInTheDocument();
});

test('renders phase', () => {
  render(<App />);
  const phaseElement = screen.getByText(/Phase: Game Start/i);
  expect(phaseElement).toBeInTheDocument();
});

test('renders flip selected button', () => {
  render(<App />);
  const flipElement = screen.getByText(/Flip Selected/i);
  expect(flipElement).toBeInTheDocument();
});

test('renders next phase button', () => {
  render(<App />);
  const nextPhaseElement = screen.getByText(/Next Phase/i);
  expect(nextPhaseElement).toBeInTheDocument();
});

test('renders undo button', () => {
  render(<App />);
  const undoElement = screen.getByText(/Undo/i);
  expect(undoElement).toBeInTheDocument();
});
