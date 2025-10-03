export * from './types'

import { authFeature } from './auth'
import { libraryFeature } from './library'
import { playlistFeature } from './playlist'
import { viewerFeature } from './viewer'
import { notificationsFeature } from './notifications'

export { authFeature, libraryFeature, playlistFeature, viewerFeature, notificationsFeature }

export const featureModules = [
  authFeature,
  libraryFeature,
  playlistFeature,
  viewerFeature,
  notificationsFeature,
]
