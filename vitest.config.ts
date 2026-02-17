import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const workspaceRoot = '/home/ubuntu/.openclaw/workspace';
const projectRoot = '/home/ubuntu/.openclaw/workspace/projects/bdd-test-dashboard';

export default defineConfig({
  plugins: [react()],
  root: projectRoot,
  resolve: {
    alias: {
      '@': path.resolve(workspaceRoot, 'src'),
    },
  },
  server: {
    fs: {
      allow: [workspaceRoot, projectRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(projectRoot, 'src/__tests__/setup.ts'),
      path.resolve(workspaceRoot, 'src/__tests__/setup.ts'),
    ],
    include: [path.resolve(workspaceRoot, 'src/**/*.test.{ts,tsx}')],
    coverage: {
      provider: 'v8',
      reportsDirectory: path.resolve(projectRoot, 'coverage'),
      reporter: ['text', 'lcov', 'html'],
      // Use relative paths from projectRoot so globs resolve correctly
      include: ['../../src/**/*.{ts,tsx}'],
      exclude: [
        '../../src/__tests__/**',
        '../../src/**/*.test.{ts,tsx}',
        '../../src/app/layout.tsx',
        '../../src/lib/firebase.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
