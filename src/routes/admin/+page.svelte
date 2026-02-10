<script lang="ts">
	let { data } = $props();
</script>

<div class="container">
	<header>
		<div class="header-row">
			<h1>All Establishments</h1>
			<a href="/setup" class="btn">Create New</a>
		</div>
		<p class="subtitle">Superuser Dashboard</p>
	</header>

	<div class="table-card">
		{#if data.establishments.length === 0}
			<p class="empty">No establishments yet.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>ID</th>
						<th>Created</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.establishments as est}
						<tr>
							<td>{est.name}</td>
							<td class="mono">{est.id}</td>
							<td>{new Date(est.created_at).toLocaleDateString()}</td>
							<td>
								<a href="/admin/{est.id}" class="link">Manage</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
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
		align-items: center;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin-top: 0.25rem;
	}

	.btn {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		background: #0ea5e9;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn:hover {
		background: #0284c7;
	}

	.table-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 0.75rem 1rem;
		background: #f9fafb;
		font-size: 0.75rem;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #e5e7eb;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		color: #374151;
	}

	.mono {
		font-family: monospace;
		font-size: 0.75rem;
		color: #666;
	}

	.link {
		color: #0ea5e9;
		text-decoration: none;
		font-weight: 500;
	}

	.link:hover {
		text-decoration: underline;
	}

	.empty {
		padding: 2rem;
		text-align: center;
		color: #666;
	}
</style>
