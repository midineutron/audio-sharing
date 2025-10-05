<script lang="ts">
  import { get, writable } from 'svelte/store'
  import { onDestroy, setContext } from 'svelte'

  import { navigate, route } from './router'

  type ThemeMode = 'light' | 'dark'

  const theme = writable<ThemeMode>('light')
  const THEME_CONTEXT = Symbol('theme-context')

  const isBrowser = typeof window !== 'undefined'
  if (isBrowser) {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (source: MediaQueryList | MediaQueryListEvent) => {
      theme.set(source.matches ? 'dark' : 'light')
    }
    apply(media)
    const handleMediaChange = (event: MediaQueryListEvent) => apply(event)
    media.addEventListener('change', handleMediaChange)
    onDestroy(() => media.removeEventListener('change', handleMediaChange))
  }

  function toggleTheme() {
    theme.update((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  setContext(THEME_CONTEXT, {
    subscribe: theme.subscribe,
    toggle: toggleTheme,
  })

  $: if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = $theme
  }

  interface Toast {
    id: number
    message: string
    variant: 'info' | 'success' | 'error'
    timeout: number
  }

  const toastStore = writable<Toast[]>([])
  const TOAST_CONTEXT = Symbol('toast-context')
  let toastId = 0
  const timers: Record<number, ReturnType<typeof setTimeout>> = {}

  function pushToast(message: string, variant: Toast['variant'] = 'info', timeout = 4000) {
    const id = ++toastId
    const toast = { id, message, variant, timeout }
    toastStore.update((list) => [...list, toast])
    if (timeout > 0 && isBrowser) {
      const timer = window.setTimeout(() => {
        dismissToast(id)
      }, timeout)
      timers[id] = timer
    }
    return id
  }

  function dismissToast(id: number) {
    const timer = timers[id]
    if (timer) {
      clearTimeout(timer)
      delete timers[id]
    }
    toastStore.update((list) => list.filter((toast) => toast.id !== id))
  }

  setContext(TOAST_CONTEXT, {
    subscribe: toastStore.subscribe,
    push: pushToast,
    dismiss: dismissToast,
  })

  onDestroy(() => {
    Object.values(timers).forEach((timer) => clearTimeout(timer))
    Object.keys(timers).forEach((key) => {
      delete timers[Number(key)]
    })
  })

  $: isViewerRoute = $route.path === '/viewer'
  $: activeDrawer = $route.query.drawer ?? null
  $: activeTrack = $route.query.track ?? 'untitled-session'

  function openDrawer(name: string) {
    const current = get(route)
    const nextQuery = { ...current.query, drawer: name }
    navigate(current.path, nextQuery)
  }

  function closeDrawer(replace = false) {
    const current = get(route)
    if (!current.query.drawer) return
    const nextQuery = { ...current.query }
    delete nextQuery.drawer
    navigate(current.path, nextQuery, { replace })
  }

  function focusTrack(trackId: string) {
    const current = get(route)
    navigate(current.path, { ...current.query, track: trackId })
    pushToast(`Now focusing on track “${trackId}”`, 'success')
  }

  function goToWorkspace() {
    const current = get(route)
    navigate('/', { track: current.query.track })
  }

  function goToViewer() {
    const current = get(route)
    navigate('/viewer', { track: current.query.track })
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && activeDrawer) {
      event.preventDefault()
      closeDrawer(true)
    }
  }

  function getDrawerLabel(name: string | null) {
    if (!name) return 'Workspace drawer'
    const labels: Record<string, string> = {
      queue: 'Collaboration queue',
      notes: 'Session notes',
    }
    return labels[name] ?? 'Workspace drawer'
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app-shell" data-view={isViewerRoute ? 'viewer' : 'workspace'}>
  <header class="top-bar">
    <div class="identity">
      <span class="badge">{isViewerRoute ? 'Live preview' : 'Creator studio'}</span>
      <h1>Audio Sharing</h1>
    </div>
    <div class="top-bar__actions">
      <button type="button" class="ghost" on:click={toggleTheme}>
        Toggle { $theme === 'dark' ? 'light' : 'dark' } mode
      </button>
      <button type="button" class="primary" on:click={() => pushToast('Saved to cloud', 'info')}>
        Quick save
      </button>
    </div>
  </header>

  <nav class="route-switcher" aria-label="Workspace navigation">
    <button type="button" class:active={!isViewerRoute} on:click={goToWorkspace} aria-current={!isViewerRoute}>
      Workspace
    </button>
    <button type="button" class:active={isViewerRoute} on:click={goToViewer} aria-current={isViewerRoute}>
      Viewer
    </button>
  </nav>

  <main class="stage">
    {#if isViewerRoute}
      <section class="viewer" aria-label="Viewer pane">
        <header>
          <h2>Live session preview</h2>
          <p>Track: <strong>{activeTrack}</strong></p>
        </header>
        <p class="viewer__copy">
          Streamlined playback renders waveforms, synchronized lyrics, and adaptive bitrates without leaving
          the browser.
        </p>
        <div class="viewer__actions">
          <button type="button" class="ghost" on:click={goToWorkspace}>Return to workspace</button>
          <button type="button" class="primary" on:click={() => pushToast('Shared to reviewer', 'success')}>
            Share link
          </button>
        </div>
      </section>
    {:else}
      <section class="workspace" aria-label="Creator workspace">
        <aside class="pane artist" aria-label="Artist pane">
          <header>
            <h2>Artist</h2>
            <p>Collaborators monitoring <strong>{activeTrack}</strong></p>
          </header>
          <ul>
            <li><button type="button" on:click={() => focusTrack('demo-mix-v1')}>Focus demo-mix-v1</button></li>
            <li>
              <button type="button" on:click={() => focusTrack('midnight-remix')}>Focus midnight-remix</button>
            </li>
            <li><button type="button" on:click={() => focusTrack('acoustic-session')}>Focus acoustic-session</button></li>
          </ul>
          <div class="pane__actions">
            <button type="button" class="ghost" on:click={() => openDrawer('queue')}>
              Open collaboration queue
            </button>
            <button type="button" class="ghost" on:click={() => openDrawer('notes')}>
              Open session notes
            </button>
          </div>
        </aside>

        <section class="pane editor" aria-label="Editor pane">
          <header>
            <h2>Editor</h2>
            <p>Adjust arrangements, assign reviewers, and push stems without interrupting playback.</p>
          </header>
          <div class="editor__actions">
            <button type="button" class="primary" on:click={goToViewer}>Launch preview</button>
            <button type="button" class="ghost" on:click={() => pushToast('Project exported', 'success')}>
              Export
            </button>
          </div>
          <div class="editor__timeline">
            <div class="timeline__track" aria-hidden="true"></div>
            <div class="timeline__scrub" aria-hidden="true"></div>
          </div>
        </section>
      </section>
    {/if}
  </main>
</div>

{#if activeDrawer}
  <button
    type="button"
    class="drawer-backdrop"
    aria-label="Close workspace drawer"
    on:click={() => closeDrawer(true)}
  ></button>
  <div class="drawer" role="dialog" aria-modal="true" aria-label={getDrawerLabel(activeDrawer)}>
    <header>
      <h3>{getDrawerLabel(activeDrawer)}</h3>
      <button type="button" class="ghost" on:click={() => closeDrawer(true)} aria-label="Close drawer">
        Close
      </button>
    </header>
    {#if activeDrawer === 'queue'}
      <p>Assign mixdowns to engineers and monitor approvals in real time.</p>
    {:else if activeDrawer === 'notes'}
      <p>Capture timestamped comments that sync back to every reviewer.</p>
    {:else}
      <p>This workspace drawer is ready for custom integrations.</p>
    {/if}
  </div>
{/if}

{#if $toastStore.length}
  <div class="toast-stack" aria-live="assertive">
    {#each $toastStore as toast (toast.id)}
      <div class="toast" data-variant={toast.variant}>
        <span>{toast.message}</span>
        <button
          type="button"
          class="toast__dismiss"
          aria-label="Dismiss notification"
          on:click={() => dismissToast(toast.id)}
        >
          ×
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--app-bg);
    color: var(--app-fg);
    transition: background 0.3s ease, color 0.3s ease;
  }

  :global(:root[data-theme='light']) {
    --app-bg: #f8fafc;
    --app-fg: #0f172a;
    --surface: #ffffff;
    --surface-muted: rgba(15, 23, 42, 0.06);
    --surface-strong: #1e293b;
    --accent: #4c1d95;
    --accent-soft: rgba(76, 29, 149, 0.14);
    --border: rgba(15, 23, 42, 0.12);
    --positive: #0f766e;
  }

  :global(:root[data-theme='dark']) {
    --app-bg: #020617;
    --app-fg: #e2e8f0;
    --surface: rgba(15, 23, 42, 0.6);
    --surface-muted: rgba(148, 163, 184, 0.08);
    --surface-strong: rgba(148, 163, 184, 0.2);
    --accent: #a855f7;
    --accent-soft: rgba(168, 85, 247, 0.2);
    --border: rgba(148, 163, 184, 0.16);
    --positive: #34d399;
  }

  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto auto 1fr;
    padding: 1.5rem clamp(1rem, 4vw, 3rem) 3rem;
    gap: 1.5rem;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    border: 1px solid var(--border);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
  }

  .top-bar h1 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    font-weight: 700;
  }

  .top-bar__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .route-switcher {
    display: inline-flex;
    background: var(--surface);
    border-radius: 999px;
    padding: 0.35rem;
    border: 1px solid var(--border);
    gap: 0.25rem;
    justify-self: flex-start;
  }

  .route-switcher button {
    border: none;
    background: transparent;
    color: inherit;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.45rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .route-switcher button.active {
    background: var(--accent);
    color: white;
  }

  .stage {
    display: flex;
    background: var(--surface);
    border-radius: 1.25rem;
    border: 1px solid var(--border);
    padding: clamp(1.25rem, 3vw, 2rem);
    min-height: 28rem;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(16rem, 1fr) minmax(24rem, 2fr);
    gap: clamp(1rem, 2vw, 2rem);
    width: 100%;
  }

  .viewer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    justify-content: space-between;
  }

  .viewer header h2,
  .viewer header p {
    margin: 0;
  }

  .viewer__copy {
    margin: 0;
    line-height: 1.6;
    color: rgba(15, 23, 42, 0.72);
  }

  :global(:root[data-theme='dark']) .viewer__copy {
    color: rgba(226, 232, 240, 0.78);
  }

  .viewer__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .pane {
    background: var(--surface-muted);
    border-radius: 1rem;
    padding: clamp(1rem, 2.5vw, 1.75rem);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pane h2 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
  }

  .pane p {
    margin: 0;
    line-height: 1.5;
  }

  .pane ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  .pane__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .editor__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .editor__timeline {
    background: var(--surface);
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
  }

  .timeline__track {
    height: 0.75rem;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--surface-strong));
  }

  .timeline__scrub {
    height: 0.45rem;
    border-radius: 999px;
    background: var(--surface-strong);
  }

  button {
    font-family: inherit;
  }

  button.primary {
    border: none;
    background: var(--accent);
    color: #fff;
    border-radius: 0.75rem;
    padding: 0.5rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
    box-shadow: 0 12px 24px rgba(76, 29, 149, 0.25);
  }

  button.primary:hover {
    transform: translateY(-1px);
  }

  button.ghost {
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    background: transparent;
    color: inherit;
    padding: 0.45rem 1.1rem;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  button.ghost:hover,
  .pane ul button:hover,
  .viewer__actions .ghost:hover {
    background: var(--surface);
  }

  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .drawer {
    position: fixed;
    right: clamp(1rem, 4vw, 3rem);
    top: clamp(1rem, 5vh, 6rem);
    bottom: clamp(1rem, 8vh, 6rem);
    width: min(22rem, 80vw);
    background: var(--surface);
    border-radius: 1.25rem;
    border: 1px solid var(--border);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.35);
  }

  .drawer header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .drawer h3 {
    margin: 0;
  }

  .toast-stack {
    position: fixed;
    right: clamp(1rem, 4vw, 3rem);
    bottom: clamp(1rem, 4vw, 2.5rem);
    display: grid;
    gap: 0.75rem;
    z-index: 20;
  }

  .toast {
    background: var(--surface);
    border-radius: 0.85rem;
    padding: 0.75rem 1rem;
    min-width: 16rem;
    border: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 15px 30px rgba(15, 23, 42, 0.25);
  }

  .toast[data-variant='success'] {
    border-color: rgba(34, 197, 94, 0.45);
  }

  .toast[data-variant='error'] {
    border-color: rgba(220, 38, 38, 0.45);
  }

  .toast__dismiss {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
  }

  @media (max-width: 960px) {
    .app-shell {
      padding: 1.25rem 1rem 2rem;
    }

    .workspace {
      grid-template-columns: 1fr;
    }
  }
</style>
