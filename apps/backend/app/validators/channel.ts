import vine from '@vinejs/vine'

/**
 * Validator for POST /channels/create
 */
export const createChannelValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  type: vine.enum(['public', 'private'] as const),
})

/**
 * Validator for POST /channels/join
 */
export const joinChannelValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
})

/**
 * Validator for POST /channels/:channelId/revoke, /invite, /kick
 */
export const channelMemberActionValidator = vine.create({
  nick: vine.string().trim().minLength(1).maxLength(255),
})

/**
 * Validator for GET /channels/:channelId/msgs query params
 */
export const channelMsgsQueryValidator = vine.create({
  beforeId: vine.number().positive().optional(),
  limit: vine.number().min(1).max(100).optional(),
})
