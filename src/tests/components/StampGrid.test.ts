import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StampGrid from '$lib/components/StampGrid.svelte';

describe('StampGrid Component', () => {
	it('should render correct number of cells', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 0 }
		});

		const cells = container.querySelectorAll('.cell');
		expect(cells).toHaveLength(9);
	});

	it('should mark correct number of cells as filled', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 5 }
		});

		const filledCells = container.querySelectorAll('.cell.filled');
		expect(filledCells).toHaveLength(5);
	});

	it('should handle zero filled cells', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 0 }
		});

		const filledCells = container.querySelectorAll('.cell.filled');
		expect(filledCells).toHaveLength(0);
	});

	it('should handle all cells filled', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 9 }
		});

		const filledCells = container.querySelectorAll('.cell.filled');
		expect(filledCells).toHaveLength(9);
	});

	it('should render checkmark SVG in filled cells', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 3 }
		});

		const filledCells = container.querySelectorAll('.cell.filled');
		filledCells.forEach((cell) => {
			const svg = cell.querySelector('svg');
			expect(svg).toBeTruthy();
		});
	});

	it('should not render checkmark in empty cells', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 9, filledCount: 3 }
		});

		const cells = Array.from(container.querySelectorAll('.cell'));
		const emptyCells = cells.filter((cell) => !cell.classList.contains('filled'));

		emptyCells.forEach((cell) => {
			const svg = cell.querySelector('svg');
			expect(svg).toBeFalsy();
		});
	});

	it('should calculate correct grid columns', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 16, filledCount: 0 }
		});

		const gridContainer = container.querySelector('.grid-container');
		const style = getComputedStyle(gridContainer!);
		// sqrt(16) = 4, so --cols should be 4
		expect(gridContainer?.style.getPropertyValue('--cols')).toBe('4');
	});

	it('should handle non-square grids', () => {
		const { container } = render(StampGrid, {
			props: { gridSize: 10, filledCount: 0 }
		});

		const cells = container.querySelectorAll('.cell');
		expect(cells).toHaveLength(10);

		const gridContainer = container.querySelector('.grid-container');
		// ceil(sqrt(10)) = 4
		expect(gridContainer?.style.getPropertyValue('--cols')).toBe('4');
	});
});
