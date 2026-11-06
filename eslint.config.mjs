import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
	{ ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
	js.configs.recommended,
	// Scripts y configuración en JavaScript (scripts/*.mjs, *.config.mjs) corren en Node:
	// sin estas variables globales, `process`, `console` y `URL` fallaban con no-undef en el CI.
	{
		files: ['**/*.{js,mjs,cjs}'],
		ignores: ['public/sw.js'],
		languageOptions: { globals: { ...globals.node } },
	},
	// El service worker corre en el navegador, en su propio contexto (self, caches, clients).
	{
		files: ['public/sw.js'],
		languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } },
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.browser, ...globals.node },
			parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			react: reactPlugin,
			'react-hooks': hooksPlugin,
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...tsPlugin.configs.recommended.rules,
			...reactPlugin.configs.recommended.rules,
			...hooksPlugin.configs.recommended.rules,
			'no-undef': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'@typescript-eslint/triple-slash-reference': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
];