import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Load workspace packages from their TypeScript source (see packages/config/tsconfig/base.json).
    conditions: ['@hopback/source', ...defaultClientConditions],
  },
});
