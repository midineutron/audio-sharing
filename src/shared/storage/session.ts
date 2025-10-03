const STORAGE_KEY = 'audio-sharing:session'

export interface SessionSnapshot {
  token: string
  refreshedAt: number
}

export const sessionStorage = {
  save(session: SessionSnapshot) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  },
  read(): SessionSnapshot | null {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as SessionSnapshot) : null
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
