<script lang="ts">
	interface Props {
		html: string;
		css: string;
	}

	let { html = $bindable(), css = $bindable() }: Props = $props();
</script>

<div class="code-editor">
	<div class="editor-section">
		<h3>HTML</h3>
		<textarea
			bind:value={html}
			class="code-textarea"
			placeholder="<div class='card-content'>
  <h2>Your Title</h2>
  <p>Your content here...</p>
</div>"
			rows="12"
			spellcheck="false"
		></textarea>
	</div>

	<div class="editor-section">
		<h3>CSS</h3>
		<textarea
			bind:value={css}
			class="code-textarea"
			placeholder="Add your custom CSS styles here..."
			rows="12"
			spellcheck="false"
		></textarea>
	</div>

	<div class="editor-info">
		<p>
			💡 <strong>Tip:</strong> Your HTML and CSS will be sanitized for security. Scripts and dangerous
			patterns will be removed.
		</p>
		<p>📏 <strong>Limits:</strong> HTML max 100KB, CSS max 50KB</p>
	</div>
</div>

<style>
	.code-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.editor-section h3 {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.code-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: vertical;
		background: #f9fafb;
		tab-size: 2;
	}

	.code-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		background: white;
	}

	.editor-info {
		padding: 1rem;
		background: #f0f9ff;
		border: 1px solid #bfdbfe;
		border-radius: 0.375rem;
	}

	.editor-info p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: #1e40af;
	}

	.editor-info p:first-child {
		margin-top: 0;
	}

	.editor-info p:last-child {
		margin-bottom: 0;
	}

	.editor-info strong {
		font-weight: 600;
	}
</style>
