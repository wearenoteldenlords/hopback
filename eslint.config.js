import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Which workspace each element may import from (besides itself).
// apps/* -> packages/*, never the other way round.
const allowedDependencies = {
  api: ['contracts'],
  web: ['app', 'ui', 'platform', 'contracts'],
  app: ['ui', 'platform', 'contracts'],
  ui: [],
  platform: [],
  contracts: [],
};

export default defineConfig(
  globalIgnores(['**/dist', '**/coverage', '**/.turbo']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/web/src/**', 'packages/{app,ui}/src/**'],
    languageOptions: {
      globals: globals.browser,
    },
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': [
        { type: 'api', pattern: 'apps/api' },
        { type: 'web', pattern: 'apps/web' },
        { type: 'app', pattern: 'packages/app' },
        { type: 'ui', pattern: 'packages/ui' },
        { type: 'platform', pattern: 'packages/platform' },
        { type: 'contracts', pattern: 'packages/contracts' },
      ],
      // pnpm links workspace packages into node_modules; classify them by
      // their real path under packages/ instead of as external modules.
      'boundaries/flag-as-external': { inNodeModules: false },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...Object.entries(allowedDependencies).map(([from, to]) => ({
              from: { element: { type: from } },
              allow: { to: { element: { types: { anyOf: [from, ...to] } } } },
            })),
          ],
        },
      ],
    },
  },
);
