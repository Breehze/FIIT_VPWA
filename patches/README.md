# Project-local socket eviction

`@rlanz__socket@0.2.4.patch` adds `socket.evict(socketId, channelName)`.
It removes a current local subscription (including a join still completing),
runs the existing channel/presence cleanup, and sends `channel:evicted` without
closing the WebSocket. It returns whether a subscription was removed.

The patched client clears the channel's intent, callbacks, and cached instance.
Our realtime service also removes its map entry. A later `socket.channel(name)`
creates a fresh instance; subscribing runs the existing membership middleware.
There is no persistent eviction list.

pnpm applies the patch automatically during `pnpm install`. Commit the patch,
`pnpm-workspace.yaml`, and `pnpm-lock.yaml` together. When upgrading the socket
package, review/rebase the patch and run the socket eviction functional test.

The API targets sockets on the current server process, matching this app's
local presence lookup.
