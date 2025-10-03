export type FeatureCategory = 'auth' | 'library' | 'playlist' | 'viewer' | 'notifications'

export interface FeatureModule {
  id: FeatureCategory
  name: string
  description: string
  route: string
  cta: string
}
