import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { setMentionOnlyNotifValidator, setStatusValidator } from '#validators/user'

@inject()
export default class UsersController {
  constructor(private userService: UserService) {}

  /**
   * GET /user
   */
  async show({ user, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(user))
  }

  /**
   * POST /user/set_status
   * Body: { status: "Online" | "DND" | "Offline" }
   */
  async setStatus({ user, request, serialize }: HttpContext) {
    const { status } = await request.validateUsing(setStatusValidator)
    const updatedUser = await this.userService.updateStatus(user, status)

    return serialize(UserTransformer.transform(updatedUser))
  }

  /**
   * POST /user/set_mention_only_notif
   * Body: { notif_only: boolean }
   */
  async setMentionOnlyNotif({ user, request, serialize }: HttpContext) {
    const { notif_only: notifOnly } = await request.validateUsing(setMentionOnlyNotifValidator)
    const updatedUser = await this.userService.updateMentionOnlyNotif(user, notifOnly)

    return serialize(UserTransformer.transform(updatedUser))
  }
}
