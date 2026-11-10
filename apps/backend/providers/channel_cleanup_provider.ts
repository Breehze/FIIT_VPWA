import logger from '@adonisjs/core/services/logger'
import ChannelService from '#services/channel_service'

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

export default class ChannelCleanupProvider {
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false

  private async cleanup() {
    if (this.running) return
    this.running = true
    try {
      const removed = await new ChannelService().pruneExpiredChannels()
      if (removed > 0) logger.info({ removed }, 'Expired inactive channels removed')
    } catch (error) {
      logger.error({ err: error }, 'Failed to remove expired channels')
    } finally {
      this.running = false
    }
  }

  ready() {
    // Run on server startup and hourly thereafter; never run during tests or CLI commands.
    void this.cleanup()
    this.timer = setInterval(() => void this.cleanup(), CLEANUP_INTERVAL_MS)
    this.timer.unref()
  }

  shutdown() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
