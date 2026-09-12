import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default [
	{ ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
	js.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
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
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
];