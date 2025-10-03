import { writable } from 'svelte/store'
import { generateCodeVerifier, generateCodeChallenge, buildAuthorizeUrl, exchangeToken, refreshAccessToken } from './api'

const isBrowser = typeof window !== 'undefined'

const TOKEN_STORAGE_KEY = 'dropbox.auth.tokens'
const PKCE_VERIFIER_KEY = 'dropbox.pkce.verifier'
const OAUTH_STATE_KEY = 'dropbox.oauth.state'

interface StoredTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'refreshing' | 'error'

export interface AuthState {
  status: AuthStatus
  tokens?: StoredTokens
  error?: string
}

interface TokenPayload {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

function getDefaultState(): AuthState {
  if (!isBrowser) {
    return { status: 'idle' }
  }

  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) {
    return { status: 'idle' }
  }

  try {
    const tokens: StoredTokens = JSON.parse(raw)
    if (tokens.expiresAt > Date.now()) {
      return { status: 'authenticated', tokens }
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (error) {
    console.error('Unable to parse stored Dropbox tokens', error)
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  return { status: 'idle' }
}

function persistTokens(tokens: StoredTokens | undefined) {
  if (!isBrowser) return

  if (!tokens) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

function persistVerifier(verifier: string | undefined) {
  if (!isBrowser) return

  if (!verifier) {
    window.localStorage.removeItem(PKCE_VERIFIER_KEY)
    return
  }

  window.localStorage.setItem(PKCE_VERIFIER_KEY, verifier)
}

function persistStateValue(state: string | undefined) {
  if (!isBrowser) return

  if (!state) {
    window.localStorage.removeItem(OAUTH_STATE_KEY)
    return
  }

  window.localStorage.setItem(OAUTH_STATE_KEY, state)
}

function resolveClientId(): string {
  const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_DROPBOX_CLIENT_ID is not configured')
  }
  return clientId
}

function resolveRedirectUri(): string {
  if (!isBrowser) return ''
  const redirectPath = import.meta.env.VITE_DROPBOX_REDIRECT_PATH || '/auth/dropbox/callback'
  return new URL(redirectPath, window.location.origin).toString()
}

function mapTokenResponse(response: { access_token: string; refresh_token?: string; expires_in: number }): TokenPayload {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresIn: response.expires_in,
  }
}

function toStoredTokens(payload: TokenPayload): StoredTokens {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt: Date.now() + payload.expiresIn * 1000,
  }
}

function clearAuthArtifacts() {
  persistTokens(undefined)
  persistVerifier(undefined)
  persistStateValue(undefined)
}

function createStateFromTokens(tokens: StoredTokens): AuthState {
  return { status: 'authenticated', tokens }
}

function randomState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function createDropboxAuthStore() {
  const store = writable<AuthState>(getDefaultState())

  async function initiateLogin() {
    try {
      store.set({ status: 'authenticating' })
      const clientId = resolveClientId()
      const redirectUri = resolveRedirectUri()
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = randomState()

      persistVerifier(verifier)
      persistStateValue(state)

      const authorizeUrl = buildAuthorizeUrl({
        clientId,
        redirectUri,
        state,
        codeChallenge: challenge,
      })

      if (isBrowser) {
        window.location.href = authorizeUrl
      }
    } catch (error) {
      console.error(error)
      store.set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to begin authentication flow' })
    }
  }

  async function handleRedirectCallback(currentUrl?: string) {
    if (!isBrowser) return

    store.update((state) => ({ ...state, status: 'authenticating' }))

    try {
      const url = new URL(currentUrl ?? window.location.href)
      const returnedState = url.searchParams.get('state')
      const storedState = window.localStorage.getItem(OAUTH_STATE_KEY)

      if (!returnedState || !storedState || returnedState !== storedState) {
        throw new Error('OAuth state mismatch, aborting login')
      }

      const code = url.searchParams.get('code')
      if (!code) {
        const message = url.searchParams.get('error_description') || url.searchParams.get('error') || 'Missing authorization code in callback'
        throw new Error(message)
      }

      const verifier = window.localStorage.getItem(PKCE_VERIFIER_KEY)
      if (!verifier) {
        throw new Error('Missing PKCE verifier to complete token exchange')
      }

      const clientId = resolveClientId()
      const redirectUri = resolveRedirectUri()
      const tokenResponse = await exchangeToken({
        code,
        clientId,
        redirectUri,
        codeVerifier: verifier,
      })

      const payload = mapTokenResponse(tokenResponse)
      const tokens = toStoredTokens(payload)
      persistTokens(tokens)
      persistVerifier(undefined)
      persistStateValue(undefined)

      store.set(createStateFromTokens(tokens))
    } catch (error) {
      console.error(error)
      clearAuthArtifacts()
      store.set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to process Dropbox callback' })
    }
  }

  async function refreshTokens() {
    store.update((state) => ({ ...state, status: 'refreshing' }))

    try {
      const clientId = resolveClientId()
      const currentTokens = getCurrentTokens()
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const tokenResponse = await refreshAccessToken({
        clientId,
        refreshToken: currentTokens.refreshToken,
      })

      const payload = mapTokenResponse(tokenResponse)
      const tokens = toStoredTokens(payload)
      tokens.refreshToken = tokens.refreshToken ?? currentTokens.refreshToken
      persistTokens(tokens)
      store.set(createStateFromTokens(tokens))
    } catch (error) {
      console.error(error)
      clearAuthArtifacts()
      store.set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to refresh Dropbox access token' })
    }
  }

  function signOut() {
    clearAuthArtifacts()
    store.set({ status: 'idle' })
  }

  function getCurrentTokens(): StoredTokens | undefined {
    let tokens: StoredTokens | undefined
    store.update((state) => {
      tokens = state.tokens
      return state
    })
    return tokens
  }

  return {
    subscribe: store.subscribe,
    initiateLogin,
    handleRedirectCallback,
    refreshTokens,
    signOut,
    getCurrentTokens,
  }
}

export const authStore = createDropboxAuthStore()
