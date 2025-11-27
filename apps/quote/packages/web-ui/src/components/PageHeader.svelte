<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    primaryColor?: string;
    primaryDarkColor?: string;
  }

  let { title, subtitle, primaryColor, primaryDarkColor }: Props = $props();

  const gradientStyle = $derived(() => {
    if (primaryColor && primaryDarkColor) {
      return `background: linear-gradient(135deg, rgb(${primaryColor}), rgb(${primaryDarkColor})); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
    }
    return `background: linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary-dark))); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
  });
</script>

<div class="header">
  <h1 class="title" style={gradientStyle()}>{title}</h1>
  {#if subtitle}
    <p class="subtitle">{subtitle}</p>
  {/if}
</div>

<style>
  .header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
  }

  .title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: var(--spacing-sm);
  }

  .subtitle {
    font-size: 1.25rem;
    color: rgb(var(--color-text-secondary));
    margin: 0;
  }

  @media (max-width: 768px) {
    .title {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }
  }
</style>
