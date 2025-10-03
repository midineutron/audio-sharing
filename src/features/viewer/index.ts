import type { FeatureModule } from '../types'

export const viewerFeature: FeatureModule = {
  id: 'viewer',
  name: 'Viewer',
  description:
    'Deliver smooth waveforms, lyric overlays, and adaptive streaming for every device and bandwidth.',
  route: '/viewer',
  cta: 'Launch player',
}
