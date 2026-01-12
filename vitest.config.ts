import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [
		svelte()
	],
	resolve: {
		// Ensure Svelte resolves to the browser/client bundle, not server
		conditions: ['browser', 'import', 'module', 'default']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		alias: {
			'$lib': '/home/ben/projects/loylt/src/lib',
			'$lib/': '/home/ben/projects/loylt/src/lib/'
		},
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
