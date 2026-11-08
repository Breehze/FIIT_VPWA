import vine from '@vinejs/vine'

/**
 * Validator for POST /invites
 */
export const invitesValidator = vine.create({
  inviteId: vine.string().uuid(),
  action: vine.enum(['accept', 'reject'] as const),
})


