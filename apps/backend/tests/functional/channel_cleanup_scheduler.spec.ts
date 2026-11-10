import { mock } from 'node:test'
import { test } from '@japa/runner'
import { Worker } from 'adonisjs-scheduler'
import scheduler from 'adonisjs-scheduler/services/main'
import ChannelService from '#services/channel_service'
import ChannelCleanupProvider from '#providers/channel_cleanup_provider'

test.group('Channel cleanup scheduler', () => {
  test('runs on startup and hourly without overlapping', async ({ assert }) => {
    const job = scheduler.items.find((item) => item.type === 'callback')
    assert.isDefined(job)
    assert.equal(job?.getExpression(), '0 0 * * * *')
    assert.isTrue(job?.config.immediate)
    assert.isTrue(job?.config.withoutOverlapping)

    const cleanup = mock.method(ChannelService.prototype, 'pruneExpiredChannels', async () => 1)
    try {
      if (job?.type === 'callback') await job.callback()
      assert.equal(cleanup.mock.callCount(), 1)
    } finally {
      cleanup.mock.restore()
    }
  })

  test('starts the worker with the web server and stops it on shutdown', async ({ assert }) => {
    const start = mock.method(Worker.prototype, 'start', async () => {})
    const stop = mock.method(Worker.prototype, 'stop', async () => {})
    try {
      const provider = new ChannelCleanupProvider()
      await provider.ready()
      await provider.shutdown()
      assert.equal(start.mock.callCount(), 1)
      assert.equal(stop.mock.callCount(), 1)
    } finally {
      start.mock.restore()
      stop.mock.restore()
    }
  })
})
