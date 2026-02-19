import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sparkline } from './sparkline';

describe('Sparkline', () => {
  it('returns null when data has fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[5]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for empty data', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img" for 2+ data points', () => {
    render(<Sparkline data={[1000, 2000, 3000]} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('uses default dimensions 80x24', () => {
    render(<Sparkline data={[100, 200]} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('width')).toBe('80');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('accepts custom width and height', () => {
    render(<Sparkline data={[100, 200]} width={120} height={40} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('width')).toBe('120');
    expect(svg.getAttribute('height')).toBe('40');
  });

  it('renders a polyline with correct stroke color', () => {
    render(<Sparkline data={[10, 20, 30]} color="#ff0000" />);
    const svg = screen.getByRole('img');
    const polyline = svg.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline?.getAttribute('stroke')).toBe('#ff0000');
  });

  it('renders a circle dot on the last data point', () => {
    render(<Sparkline data={[10, 20, 30]} color="#abcdef" />);
    const svg = screen.getByRole('img');
    const circles = svg.querySelectorAll('circle');
    // Last circle should be the visible dot with the color fill
    const visibleDot = circles[circles.length - 1];
    expect(visibleDot).toBeInTheDocument();
    expect(visibleDot?.getAttribute('fill')).toBe('#abcdef');
  });

  it('sets aria-label with formatted durations', () => {
    render(<Sparkline data={[1500, 2500]} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toBe('Duration trend: 1.5s, 2.5s');
  });

  it('applies custom className', () => {
    render(<Sparkline data={[1, 2]} className="my-sparkline" />);
    const svg = screen.getByRole('img');
    expect(svg.classList.contains('my-sparkline')).toBe(true);
  });

  it('handles data where all values are the same (range=0)', () => {
    render(<Sparkline data={[5, 5, 5]} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    // Should not crash; range defaults to 1
    const polyline = svg.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
  });
});
