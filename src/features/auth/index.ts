import type { FeatureModule } from '../types'

export const authFeature: FeatureModule = {
  id: 'auth',
  name: 'Authentication',
  description:
    'Passwordless links, social sign-on, and multi-factor enrollment keep accounts secure without friction.',
  route: '/auth',
  cta: 'Manage users',
}
