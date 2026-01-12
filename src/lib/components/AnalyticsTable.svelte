<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		establishmentId: string;
	}

	let { establishmentId }: Props = $props();

	let analytics = $state<{
		totalStamps: number;
		customers: Array<{ guid: string; stampCount: number }>;
	} | null>(null);
	let loading = $state(true);
	let error = $state('');

	onMount(() => {
		loadAnalytics();
		// Refresh analytics every 30 seconds
		const interval = setInterval(loadAnalytics, 30000);
		return () => clearInterval(interval);
	});

	async function loadAnalytics() {
		try {
			const response = await fetch(`/api/establishments/${establishmentId}/analytics`);
			if (!response.ok) {
				throw new Error('Failed to load analytics');
			}
			analytics = await response.json();
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics';
			loading = false;
		}
	}
</script>

<div class="analytics">
	{#if loading}
		<div class="loading">Loading analytics...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if analytics}
		<div class="stat-card">
			<div class="stat-value">{analytics.totalStamps}</div>
			<div class="stat-label">Total Stamps Issued</div>
		</div>

		{#if analytics.customers.length > 0}
			<div class="table-container">
				<h3>Customer Breakdown</h3>
				<table>
					<thead>
						<tr>
							<th>Customer ID</th>
							<th>Stamps</th>
						</tr>
					</thead>
					<tbody>
						{#each analytics.customers as customer}
							<tr>
								<td class="guid">{customer.guid.slice(0, 8)}...</td>
								<td class="count">{customer.stampCount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="no-data">No customer data yet. Start issuing stamps!</p>
		{/if}
	{/if}
</div>

<style>
	.analytics {
		width: 100%;
	}

	.stat-card {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.stat-value {
		font-size: 3rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.table-container {
		margin-top: 1.5rem;
	}

	h3 {
		font-size: 1.125rem;
		margin-bottom: 1rem;
		color: #333;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		background: #f3f4f6;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.guid {
		font-family: monospace;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.count {
		font-weight: 600;
		color: #0ea5e9;
	}

	.loading, .error, .no-data {
		padding: 2rem;
		text-align: center;
		color: #666;
	}

	.error {
		color: #d32f2f;
	}
</style>
