<script lang="ts">
	interface Props {
		gridSize: number;
		filledCount: number;
	}

	let { gridSize, filledCount }: Props = $props();

	const cells = $derived(Array.from({ length: gridSize }, (_, i) => ({
		id: i,
		filled: i < filledCount
	})));

	const gridCols = $derived(Math.ceil(Math.sqrt(gridSize)));
</script>

<div class="grid-container" style="--cols: {gridCols}">
	{#each cells as cell (cell.id)}
		<div class="cell" class:filled={cell.filled}>
			{#if cell.filled}
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			{/if}
		</div>
	{/each}
</div>

<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		gap: 0.75rem;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.cell {
		aspect-ratio: 1;
		border: 3px solid #e5e7eb;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		background: white;
	}

	.cell.filled {
		background: #0ea5e9;
		border-color: #0284c7;
		animation: stamp 0.3s ease;
	}

	.cell svg {
		width: 60%;
		height: 60%;
		color: white;
	}

	@keyframes stamp {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.grid-container {
			gap: 0.5rem;
		}

		.cell {
			border-width: 2px;
		}
	}
</style>
