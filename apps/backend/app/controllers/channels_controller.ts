import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelService from '#services/channel_service'
import {
  channelMemberActionValidator,
  channelMsgsQueryValidator,
  createChannelValidator,
  joinChannelValidator,
} from '#validators/channel'

@inject()
export default class ChannelsController {
  constructor(private channelService: ChannelService) {}

  /**
   * GET /channels
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return this.channelService.listUserChannels(user.id)
  }

  /**
   * GET /channels/:channelId/members
   */
  async members({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    return this.channelService.getChannelMembers(user.id, params.channelId)
  }

  /**
   * GET /channels/:channelId/msgs?beforeId=some_msg_id&limit=some_num
   */
  async messages({ auth, params, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { beforeId, limit } = await channelMsgsQueryValidator.validate(request.qs())
    return this.channelService.getChannelMessages(user.id, params.channelId, beforeId, limit)
  }

  /**
   * POST /channels/create
   * Body: { name: "channelName", type: "public" | "private" }
   */
  async create({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, type } = await request.validateUsing(createChannelValidator)
    const channel = await this.channelService.createChannel(user.id, name, type)

    return response.created(channel)
  }

  /**
   * POST /channels/join
   * Body: { name: "channelName" }
   */
  async join({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, type } = await request.validateUsing(joinChannelValidator)

    return this.channelService.joinChannel(user.id, name, type ?? 'public')
  }

  /**
   * POST /channels/:channelId/leave
   */
  async leave({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.channelService.leaveChannel(user.id, params.channelId)
    return { message: 'Left channel successfully' }
  }

  /**
   * POST /channels/:channelId/revoke
   * Body: { nick: "gettingKickedNick" }
   */
  async revoke({ auth, params, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { nick } = await request.validateUsing(channelMemberActionValidator)
    await this.channelService.revokeMember(user.id, params.channelId, nick)

    return { message: 'Member revoked successfully' }
  }

  /**
   * POST /channels/:channelId/invite
   * Body: { nick: "gettingKickedNick" }
   */
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { nick } = await request.validateUsing(channelMemberActionValidator)
    const invite = await this.channelService.inviteMember(user.id, params.channelId, nick)

    return response.created(invite)
  }

  /**
   * POST /channels/:channelId/kick
   * Body: { nick: "gettingKickedNick" }
   */
  async kick({ auth, params, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const { nick } = await request.validateUsing(channelMemberActionValidator)
    return this.channelService.kickMember(user.id, params.channelId, nick)
  }

  /**
   * DELETE /channels/:channelId
   */
  async destroy({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.channelService.deleteChannel(user.id, params.channelId)
    return { message: 'Channel deleted successfully' }
  }
}
