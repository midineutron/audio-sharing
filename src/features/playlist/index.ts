import type { FeatureModule } from '../types'

export const playlistFeature: FeatureModule = {
  id: 'playlist',
  name: 'Playlists',
  description:
    'Synchronize collaborative edits, suggested sequencing, and release-ready publishing in a single view.',
  route: '/playlists',
  cta: 'Curate tracks',
}
