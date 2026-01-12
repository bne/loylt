<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Redirect to setup page after a brief display
		const timer = setTimeout(() => {
			goto('/setup');
		}, 1500);
		return () => clearTimeout(timer);
	});
</script>

<div class="container">
	<div class="content">
		<h1>🎯 loylt</h1>
		<p>Digital Loyalty Stamp Cards</p>
		<div class="loading">Loading...</div>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.content {
		text-align: center;
		color: white;
	}

	h1 {
		font-size: 4rem;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	p {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-bottom: 2rem;
	}

	.loading {
		font-size: 1rem;
		opacity: 0.7;
	}
</style>

