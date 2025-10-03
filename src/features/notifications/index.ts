import type { FeatureModule } from '../types'

export const notificationsFeature: FeatureModule = {
  id: 'notifications',
  name: 'Notifications',
  description:
    'Automate release digests, playlist updates, and creator shout-outs across email, push, and in-app.',
  route: '/notifications',
  cta: 'Send updates',
}
