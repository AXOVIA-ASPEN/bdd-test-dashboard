import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Global mock for framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => {
      const { whileTap, whileHover, initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('button', rest, children);
    },
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('div', rest, children);
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('span', rest, children);
    },
    path: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('path', rest, children);
    },
    svg: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('svg', rest, children);
    },
    li: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return React.createElement('li', rest, children);
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Global mock for Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Global mock for Next.js link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));
