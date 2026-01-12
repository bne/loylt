<script lang="ts">
	import { goto } from '$app/navigation';

	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let result = $state<{ id: string; adminUrl: string } | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/establishments/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, password })
			});

			if (!response.ok) {
				throw new Error('Failed to create establishment');
			}

			const data = await response.json();
			result = {
				id: data.id,
				adminUrl: `${window.location.origin}/admin/${data.id}`
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Setup failed';
		} finally {
			loading = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<div class="container">
	<div class="setup-card">
		{#if !result}
			<header>
				<h1>🎯 Setup New Establishment</h1>
				<p>Create your digital loyalty stamp card program</p>
			</header>

			<form onsubmit={handleSubmit}>
				<div class="form-group">
					<label for="name">Establishment Name</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						placeholder="e.g., Joe's Coffee Shop"
						required
					/>
				</div>

				<div class="form-group">
					<label for="password">Admin Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="Min. 6 characters"
						required
					/>
				</div>

				<div class="form-group">
					<label for="confirmPassword">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						placeholder="Re-enter password"
						required
					/>
				</div>

				{#if error}
					<div class="error">{error}</div>
				{/if}

				<button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create Establishment'}
				</button>
			</form>
		{:else}
			<div class="success-view">
				<div class="success-icon">✅</div>
				<h2>Establishment Created!</h2>

				<div class="info-section">
					<h3>Your Establishment ID</h3>
					<div class="info-box">
						<code>{result.id}</code>
						<button onclick={() => copyToClipboard(result.id)} class="copy-btn">
							📋 Copy
						</button>
					</div>
				</div>

				<div class="info-section">
					<h3>Admin Dashboard URL</h3>
					<div class="info-box">
						<code class="url">{result.adminUrl}</code>
						<button onclick={() => copyToClipboard(result.adminUrl)} class="copy-btn">
							📋 Copy
						</button>
					</div>
				</div>

				<div class="warning">
					⚠️ Save these details! You'll need the admin URL to access your dashboard.
				</div>

				<button onclick={() => goto(result.adminUrl)} class="primary-btn">
					Go to Admin Dashboard
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.setup-card {
		width: 100%;
		background: white;
		padding: 2.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

	header p {
		color: #666;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.875rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	button {
		width: 100%;
		padding: 1rem;
		background: #0ea5e9;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
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
		padding: 0.875rem;
		background: #ffebee;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.success-view {
		text-align: center;
	}

	.success-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 1.75rem;
		margin-bottom: 2rem;
		color: #333;
	}

	.info-section {
		margin-bottom: 1.5rem;
		text-align: left;
	}

	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #666;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-box {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	code {
		flex: 1;
		font-family: monospace;
		font-size: 0.875rem;
		color: #374151;
		word-break: break-all;
	}

	.url {
		font-size: 0.75rem;
	}

	.copy-btn {
		width: auto;
		padding: 0.5rem 0.75rem;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		font-size: 0.875rem;
	}

	.copy-btn:hover {
		background: #f3f4f6;
	}

	.warning {
		padding: 1rem;
		background: #fff7ed;
		border: 1px solid #fed7aa;
		border-radius: 8px;
		color: #9a3412;
		margin: 1.5rem 0;
		font-size: 0.875rem;
	}

	.primary-btn {
		margin-top: 1rem;
	}
</style>
