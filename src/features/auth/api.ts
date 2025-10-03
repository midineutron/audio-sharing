const DROPBOX_AUTH_ENDPOINT = 'https://www.dropbox.com/oauth2/authorize'
const DROPBOX_TOKEN_ENDPOINT = 'https://api.dropboxapi.com/oauth2/token'

const CODE_VERIFIER_LENGTH = 128

const encoder = new TextEncoder()

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateCodeVerifier(): string {
  const randomValues = new Uint8Array(CODE_VERIFIER_LENGTH)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(randomValues)
  } else {
    for (let i = 0; i < randomValues.length; i += 1) {
      randomValues[i] = Math.floor(Math.random() * 256)
    }
  }

  return base64UrlEncode(randomValues.buffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is not available to generate PKCE challenge')
  }

  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

interface AuthorizeUrlOptions {
  clientId: string
  redirectUri: string
  state?: string
  codeChallenge: string
  scope?: string
}

export function buildAuthorizeUrl({
  clientId,
  redirectUri,
  state,
  codeChallenge,
  scope = 'files.metadata.read files.content.read',
}: AuthorizeUrlOptions): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    token_access_type: 'offline',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope,
  })

  if (state) {
    params.set('state', state)
  }

  return `${DROPBOX_AUTH_ENDPOINT}?${params.toString()}`
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
  account_id?: string
  uid?: string
}

interface ExchangeTokenOptions {
  code: string
  clientId: string
  redirectUri: string
  codeVerifier: string
}

export async function exchangeToken({
  code,
  clientId,
  redirectUri,
  codeVerifier,
}: ExchangeTokenOptions): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })

  const response = await fetch(DROPBOX_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange authorization code: ${response.status}`)
  }

  return response.json()
}

interface RefreshTokenOptions {
  clientId: string
  refreshToken: string
}

export async function refreshAccessToken({
  clientId,
  refreshToken,
}: RefreshTokenOptions): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  })

  const response = await fetch(DROPBOX_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${response.status}`)
  }

  return response.json()
}
