import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import InviteService from '#services/invite_service'
import { invitesValidator } from '#validators/invite'

@inject()
export default class InviteController {
  constructor(private inviteService: InviteService) {}

  /**
   * GET /invites
   */
  async list({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return this.inviteService.listPending(user)
  }

  /**
   * POST /invites
   * Body: { inviteId : "inviteId", action:"accept"|"reject" }
   */
  async processInvite({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { inviteId, action } = await request.validateUsing(invitesValidator)
    return this.inviteService.process(user.id, inviteId, action)
  }
}
