import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import { setMentionOnlyNotifValidator, setStatusValidator } from '#validators/user'

@inject()
export default class UsersController {
  constructor(private userService: UserService) {}

  /**
   * GET /user
   */
  async show({ auth }: HttpContext) {
    return auth.getUserOrFail()
  }

  /**
   * POST /user/set_status
   * Body: { status: "Online" | "DND" | "Offline" }
   */
  async setStatus({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status } = await request.validateUsing(setStatusValidator)
    return this.userService.updateStatus(user, status)
  }

  /**
   * POST /user/set_mention_only_notif
   * Body: { notif_only: boolean }
   */
  async setMentionOnlyNotif({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { notif_only: notifOnly } = await request.validateUsing(setMentionOnlyNotifValidator)
    return this.userService.updateMentionOnlyNotif(user, notifOnly)
  }
}
