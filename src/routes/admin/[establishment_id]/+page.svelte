<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import QRDisplay from '$lib/components/QRDisplay.svelte';
	import AnalyticsTable from '$lib/components/AnalyticsTable.svelte';

	let { data } = $props();

	let authenticated = $state(false);
	let password = $state('');
	let establishment = $state<{ id: string; name: string; gridSize: number } | null>(null);
	let name = $state('');
	let gridSize = $state(9);
	let error = $state('');
	let successMessage = $state('');
	let loading = $state(false);

	const establishmentId = $derived($page.params.establishment_id);

	onMount(() => {
		// Check if already authenticated in session
		const authKey = `loylt_auth_${establishmentId}`;
		const savedAuth = sessionStorage.getItem(authKey);
		if (savedAuth === 'true') {
			authenticated = true;
			loadEstablishmentData();
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/establishments/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ establishmentId, password })
			});

			if (!response.ok) {
				throw new Error('Invalid password');
			}

			authenticated = true;
			const authKey = `loylt_auth_${establishmentId}`;
			sessionStorage.setItem(authKey, 'true');

			await loadEstablishmentData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			loading = false;
		}
	}

	async function loadEstablishmentData() {
		try {
			const response = await fetch(`/api/establishments/${establishmentId}/config`);
			establishment = await response.json();
			name = establishment?.name || '';
			gridSize = establishment?.gridSize || 9;
		} catch (err) {
			error = 'Failed to load establishment data';
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		error = '';
		successMessage = '';
		loading = true;

		try {
			const response = await fetch(`/api/establishments/${establishmentId}/update`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password, name, gridSize })
			});

			if (!response.ok) {
				throw new Error('Failed to update settings');
			}

			successMessage = 'Settings updated successfully!';
			setTimeout(() => successMessage = '', 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Update failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	{#if !authenticated}
		<div class="login-card">
			<h1>Admin Login</h1>
			<form onsubmit={handleLogin}>
				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
					/>
				</div>
				{#if error}
					<div class="error">{error}</div>
				{/if}
				<button type="submit" disabled={loading}>
					{loading ? 'Logging in...' : 'Login'}
				</button>
			</form>
		</div>
	{:else}
		<header>
			<h1>Admin Dashboard</h1>
			<p class="establishment-id">ID: {establishmentId}</p>
		</header>

		<div class="sections">
			<section class="card">
				<h2>QR Code Generator</h2>
				<QRDisplay {establishmentId} />
			</section>

			<section class="card">
				<h2>Settings</h2>
				<form onsubmit={handleUpdate}>
					<div class="form-group">
						<label for="name">Establishment Name</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							required
						/>
					</div>
					<div class="form-group">
						<label for="gridSize">Grid Size (number of stamps)</label>
						<input
							type="number"
							id="gridSize"
							bind:value={gridSize}
							min="4"
							max="20"
							required
						/>
					</div>
					{#if error}
						<div class="error">{error}</div>
					{/if}
					{#if successMessage}
						<div class="success">{successMessage}</div>
					{/if}
					<button type="submit" disabled={loading}>
						{loading ? 'Updating...' : 'Update Settings'}
					</button>
				</form>
			</section>

			<section class="card">
				<h2>Analytics</h2>
				<AnalyticsTable {establishmentId} />
			</section>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	.login-card {
		max-width: 400px;
		margin: 10vh auto;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.establishment-id {
		color: #666;
		font-family: monospace;
		font-size: 0.875rem;
	}

	.sections {
		display: grid;
		gap: 2rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		.sections {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: #333;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background: #0ea5e9;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #0284c7;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #d32f2f;
		padding: 0.75rem;
		background: #ffebee;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.success {
		color: #2e7d32;
		padding: 0.75rem;
		background: #e8f5e9;
		border-radius: 6px;
		margin-bottom: 1rem;
	}
</style>
