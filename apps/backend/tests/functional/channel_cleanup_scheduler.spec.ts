import { mock } from 'node:test'
import { test } from '@japa/runner'
import ChannelService from '#services/channel_service'
import ChannelCleanupProvider from '#providers/channel_cleanup_provider'

test.group('Channel cleanup scheduler', () => {
  test('runs at startup and hourly, skips overlapping sweeps, and stops on shutdown', async ({
    assert,
  }) => {
    let scheduled: (() => void) | undefined
    let intervalMs: number | undefined
    let unrefCalled = false
    let cleared = false
    const timer = {
      unref: () => {
        unrefCalled = true
      },
    } as ReturnType<typeof setInterval>
    const interval = mock.method(globalThis, 'setInterval', (callback: () => void, ms: number) => {
      scheduled = callback as () => void
      intervalMs = ms
      return timer
    })
    const clear = mock.method(
      globalThis,
      'clearInterval',
      (handle: ReturnType<typeof setInterval>) => {
        assert.equal(handle, timer)
        cleared = true
      }
    )

    let completeFirstRun: ((value: number) => void) | undefined
    let runs = 0
    const cleanup = mock.method(ChannelService.prototype, 'pruneExpiredChannels', () => {
      runs++
      if (runs === 1) {
        return new Promise<number>((resolve) => {
          completeFirstRun = resolve
        })
      }
      return Promise.resolve(0)
    })
    const provider = new ChannelCleanupProvider()

    try {
      provider.ready()
      assert.equal(intervalMs, 60 * 60 * 1000)
      assert.isTrue(unrefCalled)
      assert.equal(runs, 1)

      scheduled?.()
      assert.equal(runs, 1, 'a scheduled sweep cannot overlap the startup sweep')

      completeFirstRun?.(0)
      await new Promise<void>((resolve) => setImmediate(resolve))
      scheduled?.()
      assert.equal(runs, 2)

      provider.shutdown()
      assert.isTrue(cleared)
    } finally {
      completeFirstRun?.(0)
      provider.shutdown()
      cleanup.mock.restore()
      clear.mock.restore()
      interval.mock.restore()
    }
  })
})
