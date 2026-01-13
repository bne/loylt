import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [
		svelte()
	],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		},
		// Ensure Svelte resolves to the browser/client bundle, not server
		conditions: ['browser', 'import', 'module', 'default']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/tests/',
				'**/*.spec.ts',
				'**/*.test.ts'
			]
		}
	}
});
