/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import db from '@adonisjs/lucid/services/db'

const UsersController = () => import('#controllers/users_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const InviteController = () => import('#controllers/invite_controller')

router.get('/', async () => {
  const result = await db.rawQuery('SELECT 1 AS connected')
  console.log(result.rows)
  return { hello: 'world' }
})

router.post('/register', [controllers.NewAccount, 'store'])
router.post('/login', [controllers.AccessTokens, 'store'])

router
  .group(() => {
    router.post('/logout', [controllers.AccessTokens, 'destroy'])
    router.get('/user', [UsersController, 'show'])
    router.post('/user/set_status', [UsersController, 'setStatus'])
    router.post('/user/set_mention_only_notif', [UsersController, 'setMentionOnlyNotif'])

    router.get('/channels', [ChannelsController, 'index'])
    router.get('/channels/:channelId/members', [ChannelsController, 'members'])
    router.get('/channels/:channelId/kick-votes', [ChannelsController, 'kickVotes'])
    router.get('/channels/:channelId/msgs', [ChannelsController, 'messages'])
    router.post('/channels/create', [ChannelsController, 'create'])
    router.post('/channels/join', [ChannelsController, 'join'])
    router.post('/channels/:channelId/leave', [ChannelsController, 'leave'])
    router.post('/channels/:channelId/revoke', [ChannelsController, 'revoke'])
    router.post('/channels/:channelId/invite', [ChannelsController, 'invite'])
    router.post('/channels/:channelId/kick', [ChannelsController, 'kick'])
    router.delete('/channels/:channelId', [ChannelsController, 'destroy'])

    router.get('/invites', [InviteController, 'list'])
    router.post('/invites', [InviteController, 'processInvite'])
  })
  .use(middleware.auth({ guards: ['web'] }))
