<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import StampGrid from '$lib/components/StampGrid.svelte';

	let { data } = $props();

	let establishment = $state<{ id: string; name: string; gridSize: number; rewardText: string | null; rewardImageUrl: string | null } | null>(null);
	let stampCount = $state(0);
	let loading = $state(true);
	let error = $state('');
	let customerGuid = $state('');

	const establishmentId = $derived($page.params.establishment_id);
	const token = $derived($page.url.searchParams.get('token'));

	function resetCard() {
		const stampKey = `loylt_stamps_${establishmentId}`;
		localStorage.setItem(stampKey, '0');
		stampCount = 0;
	}

	onMount(async () => {
		try {
			// Get or create customer GUID for this establishment
			const storageKey = `loylt_customer_${establishmentId}`;
			let guid = localStorage.getItem(storageKey);

			if (!guid) {
				const response = await fetch('/api/tokens/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ generateGuid: true })
				});
				const data = await response.json();
				guid = crypto.randomUUID();
				localStorage.setItem(storageKey, guid);
			}

			customerGuid = guid;

			// Fetch establishment config
			const configResponse = await fetch(`/api/establishments/${establishmentId}/config`);
			if (!configResponse.ok) {
				throw new Error('Establishment not found');
			}
			establishment = await configResponse.json();

			// Get current stamp count
			const stampKey = `loylt_stamps_${establishmentId}`;
			stampCount = parseInt(localStorage.getItem(stampKey) || '0');

			// Validate token if present
			if (token && stampCount < (establishment?.gridSize || 9)) {
				const validateResponse = await fetch('/api/tokens/validate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, customerGuid })
				});

				if (validateResponse.ok) {
					stampCount++;
					localStorage.setItem(stampKey, stampCount.toString());
				}
			}

			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load stamp card';
			loading = false;
		}
	});
</script>

<div class="container">
	{#if loading}
		<div class="loading">Loading your stamp card...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if establishment}
		<header>
			<h1>{establishment.name}</h1>
			<p class="progress">{stampCount} / {establishment.gridSize} stamps</p>
		</header>

		<StampGrid
			gridSize={establishment.gridSize}
			filledCount={stampCount}
		/>

		{#if stampCount >= establishment.gridSize}
			<div class="completed">
				<h2>Card Complete!</h2>

				{#if establishment.rewardImageUrl}
					<div class="reward-image">
						<img src={establishment.rewardImageUrl} alt="Your reward" />
					</div>
				{/if}

				{#if establishment.rewardText}
					<p class="reward-text">{establishment.rewardText}</p>
				{:else}
					<p>You've completed your stamp card!</p>
				{/if}

				<p class="instruction">Show this screen to a staff member to claim your reward</p>

				<button class="reset-btn" onclick={resetCard}>
					Start New Card
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.progress {
		font-size: 1.25rem;
		color: #666;
		font-weight: 500;
	}

	.loading, .error {
		text-align: center;
		padding: 2rem;
		font-size: 1.25rem;
	}

	.error {
		color: #d32f2f;
	}

	.completed {
		margin-top: 2rem;
		text-align: center;
		padding: 2rem;
		background: #f0f9ff;
		border-radius: 12px;
		border: 2px solid #0ea5e9;
		width: 100%;
		max-width: 500px;
	}

	.completed h2 {
		margin-bottom: 1rem;
		color: #0369a1;
		font-size: 1.75rem;
	}

	.reward-image {
		margin-bottom: 1.5rem;
		border-radius: 8px;
		overflow: hidden;
	}

	.reward-image img {
		width: 100%;
		max-height: 250px;
		object-fit: cover;
	}

	.reward-text {
		font-size: 1.25rem;
		font-weight: 600;
		color: #075985;
		margin-bottom: 1rem;
	}

	.instruction {
		font-size: 0.9rem;
		color: #64748b;
		margin-bottom: 1.5rem;
		font-style: italic;
	}

	.reset-btn {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: white;
		color: #0369a1;
		border: 2px solid #0ea5e9;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background: #e0f2fe;
	}
</style>
