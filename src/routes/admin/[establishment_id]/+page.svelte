<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import QRDisplay from '$lib/components/QRDisplay.svelte';
	import AnalyticsTable from '$lib/components/AnalyticsTable.svelte';

	let { data } = $props();

	let name = $state(data.establishment.name);
	let gridSize = $state(data.establishment.gridSize);
	let error = $state('');
	let successMessage = $state('');
	let loading = $state(false);

	// Admin management
	let newAdminEmail = $state('');
	let newAdminPassword = $state('');
	let adminError = $state('');
	let adminLoading = $state(false);

	const establishmentId: string = $derived($page.params.establishment_id);
	const user = $derived(data.user);

	async function handleUpdate(e: Event) {
		e.preventDefault();
		error = '';
		successMessage = '';
		loading = true;

		try {
			const response = await fetch(`/api/establishments/${establishmentId}/update`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, gridSize })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update settings');
			}

			successMessage = 'Settings updated successfully!';
			setTimeout(() => successMessage = '', 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Update failed';
		} finally {
			loading = false;
		}
	}

	async function handleAddAdmin(e: Event) {
		e.preventDefault();
		adminError = '';
		adminLoading = true;

		try {
			const response = await fetch(`/api/establishments/${establishmentId}/admins`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || 'Failed to add admin');
			}

			newAdminEmail = '';
			newAdminPassword = '';
			await invalidateAll();
		} catch (err) {
			adminError = err instanceof Error ? err.message : 'Failed to add admin';
		} finally {
			adminLoading = false;
		}
	}

	async function handleRemoveAdmin(adminId: string) {
		if (!confirm('Are you sure you want to remove this admin?')) return;

		try {
			const response = await fetch(`/api/establishments/${establishmentId}/admins/${adminId}`, {
				method: 'DELETE'
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || 'Failed to remove admin');
			}

			await invalidateAll();
		} catch (err) {
			adminError = err instanceof Error ? err.message : 'Failed to remove admin';
		}
	}

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}
</script>

<div class="container">
	<header>
		<div class="header-row">
			<div>
				<h1>Admin Dashboard</h1>
				<p class="establishment-id">ID: {establishmentId}</p>
			</div>
			<div class="header-actions">
				<span class="user-email">{user.email}</span>
				<button onclick={handleLogout} class="logout-btn">Logout</button>
			</div>
		</div>
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
			<h2>Admins</h2>
			<div class="admin-list">
				{#each data.admins as admin}
					<div class="admin-row">
						<span class="admin-email">{admin.email}</span>
						{#if admin.id === user.id}
							<span class="badge you">You</span>
						{:else}
							<button onclick={() => handleRemoveAdmin(admin.id)} class="remove-btn">Remove</button>
						{/if}
					</div>
				{/each}
			</div>

			<form onsubmit={handleAddAdmin} class="add-admin-form">
				<h3>Add Admin</h3>
				<div class="form-group">
					<input
						type="email"
						bind:value={newAdminEmail}
						placeholder="Email address"
						required
					/>
				</div>
				<div class="form-group">
					<input
						type="password"
						bind:value={newAdminPassword}
						placeholder="Password (min. 6 characters)"
						required
					/>
				</div>
				{#if adminError}
					<div class="error">{adminError}</div>
				{/if}
				<button type="submit" disabled={adminLoading}>
					{adminLoading ? 'Adding...' : 'Add Admin'}
				</button>
			</form>
		</section>

		<section class="card">
			<h2>Analytics</h2>
			<AnalyticsTable {establishmentId} />
		</section>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-email {
		color: #666;
		font-size: 0.875rem;
	}

	.logout-btn {
		width: auto;
		padding: 0.5rem 1rem;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.logout-btn:hover {
		background: #f3f4f6;
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

	h3 {
		font-size: 1rem;
		margin-bottom: 0.75rem;
		color: #555;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
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

	.admin-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.admin-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.625rem 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	.admin-email {
		font-size: 0.875rem;
		color: #374151;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.badge.you {
		background: #e0f2fe;
		color: #0369a1;
	}

	.remove-btn {
		width: auto;
		padding: 0.25rem 0.75rem;
		background: white;
		color: #d32f2f;
		border: 1px solid #ffcdd2;
		font-size: 0.75rem;
	}

	.remove-btn:hover:not(:disabled) {
		background: #ffebee;
	}

	.add-admin-form {
		margin-top: 0.5rem;
	}
</style>
