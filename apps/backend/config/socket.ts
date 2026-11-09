import app from '@adonisjs/core/services/app'
import { authenticateWithAdonisAuth, defineConfig } from '@rlanz/socket'
import type User from '#models/user'

export default defineConfig({
  websocket: {
    // The frontend and API use different localhost ports in development.
    origin: app.inDev ? true : undefined,
    middleware: [
      () => import('@adonisjs/session/session_middleware'),
      () => import('@adonisjs/auth/initialize_auth_middleware'),
    ],
    authenticate: authenticateWithAdonisAuth<User>(),
  },
})
