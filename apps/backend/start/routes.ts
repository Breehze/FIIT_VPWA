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
    router.get('/user', [controllers.Users, 'show'])
    router.post('/user/set_status', [controllers.Users, 'setStatus'])
    router.post('/user/set_mention_only_notif', [controllers.Users, 'setMentionOnlyNotif'])
  })
  .use(middleware.auth({ guards: ['web'] }))
