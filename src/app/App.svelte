<script lang="ts">
  import FeatureCard from '@shared/ui/FeatureCard.svelte'
  import { featureModules } from '@features/index'

  const featureHighlights = featureModules
</script>

<main class="app">
  <header class="hero">
    <div class="hero__content">
      <h1>Audio Sharing</h1>
      <p>
        A modular Svelte single-page application scaffolded for fast iteration on streaming and
        collaboration experiences.
      </p>
    </div>
  </header>

  <section class="feature-grid" aria-label="Platform capabilities">
    {#each featureHighlights as feature (feature.id)}
      <FeatureCard {...feature} />
    {/each}
  </section>
</main>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .hero {
    background: linear-gradient(135deg, rgba(76, 29, 149, 0.95), rgba(14, 116, 144, 0.9));
    color: white;
    padding: 6rem 1.5rem 4rem;
  }

  .hero__content {
    max-width: 60rem;
    margin: 0 auto;
    text-align: center;
  }

  .hero h1 {
    font-size: clamp(2.5rem, 6vw, 3.5rem);
    margin-bottom: 0.75rem;
    font-weight: 700;
  }

  .hero p {
    font-size: 1.125rem;
    line-height: 1.6;
    margin: 0;
  }

  .feature-grid {
    flex: 1;
    display: grid;
    gap: 1.5rem;
    padding: 0 1.5rem 3rem;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    max-width: 80rem;
    margin: 0 auto;
    width: 100%;
  }

  @media (prefers-color-scheme: dark) {
    .hero {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(14, 165, 233, 0.9));
    }
  }
</style>
