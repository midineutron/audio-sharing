<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, type AuthState } from '../store'

  const buttonDisabledStatuses = new Set(['authenticating', 'refreshing'] as const)

  let state: AuthState = { status: 'idle' }

  onMount(() => {
    const unsubscribe = authStore.subscribe((value) => {
      state = value
    })

    const hasAuthParams = typeof window !== 'undefined' && /[?&](code|error)=/.test(window.location.search)
    if (hasAuthParams) {
      authStore.handleRedirectCallback()
    }

    return () => {
      unsubscribe()
    }
  })

  function connectDropbox() {
    authStore.initiateLogin()
  }
</script>

<section class="connect-dropbox">
  <div class="content">
    <h2>Connect your Dropbox</h2>
    <p class="description">
      Link Dropbox to import shared audio files securely with read-only access.
    </p>

    {#if state?.status === 'authenticated'}
      <p class="status success">Dropbox account connected.</p>
    {:else if state?.status === 'error'}
      <p class="status error">{state.error ?? 'Unable to connect to Dropbox.'}</p>
    {:else if state?.status === 'authenticating'}
      <p class="status info">Redirecting to Dropbox…</p>
    {:else if state?.status === 'refreshing'}
      <p class="status info">Refreshing Dropbox session…</p>
    {/if}

    <button
      class="cta"
      type="button"
      on:click={connectDropbox}
      disabled={state && buttonDisabledStatuses.has(state.status)}
    >
      {#if state?.status === 'authenticating'}
        Connecting…
      {:else if state?.status === 'authenticated'}
        Reconnect Dropbox
      {:else}
        Connect Dropbox
      {/if}
    </button>
  </div>
</section>

<style>
  .connect-dropbox {
    padding: 1.5rem;
    background: var(--surface-1, #f5f7fb);
    border-radius: 1rem;
    display: flex;
    justify-content: center;
  }

  .content {
    width: min(28rem, 100%);
    text-align: center;
    display: grid;
    gap: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .description {
    margin: 0;
    color: var(--text-muted, #5f6b7c);
    font-size: 0.95rem;
  }

  .cta {
    background: var(--accent, #0061ff);
    border: none;
    color: white;
    padding: 0.85rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .cta:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(0, 97, 255, 0.25);
  }

  .status {
    margin: 0;
    font-size: 0.9rem;
  }

  .status.success {
    color: #0a8754;
  }

  .status.error {
    color: #c62828;
  }

  .status.info {
    color: #3b5bdb;
  }

  @media (max-width: 480px) {
    .connect-dropbox {
      padding: 1.25rem;
    }

    h2 {
      font-size: 1.35rem;
    }

    .cta {
      width: 100%;
      font-size: 1.05rem;
    }
  }
</style>
