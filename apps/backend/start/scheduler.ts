import logger from '@adonisjs/core/services/logger'
import scheduler from 'adonisjs-scheduler/services/main'
import ChannelService from '#services/channel_service'

scheduler
  .call(async () => {
    const removed = await new ChannelService().pruneExpiredChannels()
    if (removed > 0) logger.info({ removed }, 'Expired inactive channels removed')
  })
  .hourly()
  .immediate()
  .withoutOverlapping()
