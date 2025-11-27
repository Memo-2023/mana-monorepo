<script lang="ts">
	interface Props {
		variant?: 'default' | 'compact' | 'hero' | 'minimal' | 'glass' | 'gradient';
		layout?: {
			padding?: string;
			gap?: string;
			columns?: number;
		};
		animations?: {
			hover?: boolean;
			entrance?: 'fade' | 'slide' | 'scale' | 'none';
		};
		className?: string;
		children?: any;
	}

	let {
		variant = 'default',
		layout = {},
		animations = {},
		className = '',
		children,
	}: Props = $props();

	// Generate CSS classes based on variant
	let variantClasses = $derived(() => {
		const classes = {
			default: 'bg-white border border-gray-200 shadow-sm',
			compact: 'bg-white border border-gray-200 shadow-sm p-2',
			hero: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg',
			minimal: 'bg-transparent border-none',
			glass: 'bg-white/20 backdrop-blur-md border border-white/30',
			gradient: 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200',
		};
		return classes[variant] || classes.default;
	});

	// Generate layout styles
	let layoutStyles = $derived(() => {
		const styles = [];
		if (layout.padding) styles.push(`padding: ${layout.padding}`);
		if (layout.gap) styles.push(`gap: ${layout.gap}`);
		return styles.join('; ');
	});

	// Generate animation classes
	let animationClasses = $derived(() => {
		const classes = [];
		if (animations.hover)
			classes.push('hover:shadow-md hover:scale-[1.02] transition-all duration-200');
		if (animations.entrance === 'fade') classes.push('animate-fade-in');
		return classes.join(' ');
	});
</script>

<div class="rounded-lg {variantClasses()} {animationClasses()} {className}" style={layoutStyles()}>
	{@render children()}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-in-out;
	}
</style>
