<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	interface Props {
		establishmentId: string;
	}

	let { establishmentId }: Props = $props();

	let qrDataUrl = $state('');
	let currentToken = $state('');
	let loading = $state(false);
	let error = $state('');

	onMount(() => {
		generateQR();
	});

	async function generateQR() {
		loading = true;
		error = '';

		try {
			// Generate new token
			const response = await fetch('/api/tokens/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ establishmentId })
			});

			if (!response.ok) {
				throw new Error('Failed to generate token');
			}

			const { token } = await response.json();
			currentToken = token;

			// Generate QR code
			const url = `${window.location.origin}/stamp/${establishmentId}?token=${token}`;
			qrDataUrl = await QRCode.toDataURL(url, {
				width: 300,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				}
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate QR code';
		} finally {
			loading = false;
		}
	}

	function downloadQR() {
		const link = document.createElement('a');
		link.download = `qr-code-${Date.now()}.png`;
		link.href = qrDataUrl;
		link.click();
	}
</script>

<div class="qr-display">
	{#if loading}
		<div class="loading">Generating QR code...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if qrDataUrl}
		<div class="qr-container">
			<img src={qrDataUrl} alt="QR Code" />
		</div>
		<div class="actions">
			<button onclick={generateQR} class="refresh-btn">
				🔄 Generate New QR Code
			</button>
			<button onclick={downloadQR} class="download-btn">
				⬇️ Download
			</button>
		</div>
		<p class="hint">
			Customers scan this code to receive a stamp. Generate a new one for each transaction.
		</p>
	{/if}
</div>

<style>
	.qr-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.qr-container {
		background: white;
		padding: 1rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.qr-container img {
		display: block;
		width: 250px;
		height: 250px;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	button {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.refresh-btn {
		background: #f3f4f6;
		color: #374151;
	}

	.refresh-btn:hover {
		background: #e5e7eb;
	}

	.download-btn {
		background: #0ea5e9;
		color: white;
	}

	.download-btn:hover {
		background: #0284c7;
	}

	.hint {
		font-size: 0.875rem;
		color: #666;
		text-align: center;
		max-width: 300px;
	}

	.loading, .error {
		padding: 2rem;
		text-align: center;
	}

	.error {
		color: #d32f2f;
	}
</style>
