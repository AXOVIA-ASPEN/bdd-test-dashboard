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
    // Tell vite to look in the project node_modules for resolution
  },
  server: {
    fs: {
      allow: [workspaceRoot, projectRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(workspaceRoot, 'src/__tests__/setup.ts')],
    include: [path.resolve(workspaceRoot, 'src/**/*.test.{ts,tsx}')],
    coverage: {
      provider: 'v8',
      include: [path.resolve(workspaceRoot, 'src/**/*.{ts,tsx}')],
      exclude: [
        path.resolve(workspaceRoot, 'src/__tests__/**'),
        path.resolve(workspaceRoot, 'src/app/layout.tsx'),
        path.resolve(workspaceRoot, 'src/lib/firebase.ts'),
      ],
    },
  },
});
