<script lang="ts">
  import type { FeatureModule } from '@features/types'

  export let id: FeatureModule['id']
  export let name: FeatureModule['name']
  export let description: FeatureModule['description']
  export let cta: FeatureModule['cta']
  export let route: FeatureModule['route']

  const accentTokens: Record<FeatureModule['id'], string> = {
    auth: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.6))',
    library: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(129, 140, 248, 0.45))',
    playlist: 'linear-gradient(135deg, rgba(190, 242, 100, 0.3), rgba(34, 197, 94, 0.5))',
    viewer: 'linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(249, 115, 22, 0.4))',
    notifications: 'linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(236, 72, 153, 0.45))',
  }

  $: accentBackground = accentTokens[id]
</script>

<article class="feature" style={`--feature-accent: ${accentBackground}`}>
  <header>
    <span class="feature__badge">{name}</span>
    <h2>{name}</h2>
    <p>{description}</p>
  </header>
  <footer>
    <a class="feature__cta" href={route} on:click|preventDefault>
      <span>{cta}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M5 12h14m0 0-5-5m5 5-5 5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </a>
  </footer>
</article>

<style>
  .feature {
    --shadow-color: rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.25rem;
    padding: 1.75rem;
    background: white;
    box-shadow: 0 20px 45px var(--shadow-color);
    border: 1px solid rgba(148, 163, 184, 0.2);
    position: relative;
    overflow: hidden;
  }

  .feature::before {
    content: '';
    position: absolute;
    inset: -40% 20% auto;
    height: 12rem;
    transform: rotate(-12deg);
    background: var(--feature-accent);
    opacity: 0.85;
    pointer-events: none;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .feature__badge {
    align-self: flex-start;
    background: rgba(15, 23, 42, 0.85);
    color: white;
    padding: 0.35rem 0.85rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    position: relative;
    z-index: 1;
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.4;
    color: rgba(15, 23, 42, 0.9);
    position: relative;
    z-index: 1;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(15, 23, 42, 0.75);
    position: relative;
    z-index: 1;
  }

  footer {
    position: relative;
    z-index: 1;
  }

  .feature__cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.9);
    color: white;
    font-weight: 600;
    text-decoration: none;
    transition: transform 150ms ease, box-shadow 150ms ease;
  }

  .feature__cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
  }

  .feature__cta svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  @media (prefers-color-scheme: dark) {
    .feature {
      background: rgba(15, 23, 42, 0.8);
      border-color: rgba(148, 163, 184, 0.25);
      --shadow-color: rgba(2, 6, 23, 0.8);
    }

    .feature__badge {
      background: rgba(226, 232, 240, 0.95);
      color: rgba(15, 23, 42, 0.85);
    }

    h2 {
      color: rgba(226, 232, 240, 0.95);
    }

    p {
      color: rgba(226, 232, 240, 0.75);
    }

    .feature__cta {
      background: rgba(226, 232, 240, 0.95);
      color: rgba(15, 23, 42, 0.92);
    }
  }
</style>
