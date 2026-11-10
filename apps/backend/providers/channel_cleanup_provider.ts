import app from '@adonisjs/core/services/app'
import { Worker } from 'adonisjs-scheduler'

export default class ChannelCleanupProvider {
  private worker = new Worker(app)

  async ready() {
    await this.worker.start()
  }

  async shutdown() {
    await this.worker.stop()
  }
}
