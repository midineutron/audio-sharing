import type { FeatureModule } from '../types'

export const libraryFeature: FeatureModule = {
  id: 'library',
  name: 'Library',
  description:
    'Ingest and tag uploads, enrich metadata, and expose catalog search APIs for every playback surface.',
  route: '/library',
  cta: 'Browse catalog',
}
