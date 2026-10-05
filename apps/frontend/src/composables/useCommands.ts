import { useChannels } from './useChannels';
import { useAuth } from './useAuth';

export function useCommands() {
  const { currentUser } = useAuth();
  const { activeChannel, leaveChannel, joinChannel, deleteChannel } = useChannels();

  function execCommand(commandStr: string): string | null {
    const [cmd, ...args] = commandStr.slice(1).trim().split(/\s+/);
    const channel = activeChannel.value;
    if (!cmd || !channel || !currentUser.value) return null;

    try {
      switch (cmd.toLowerCase()) {
        case 'join':
          if (args[0]) joinChannel(args[0], args[1] === 'private' ? 'private' : 'public');
          break;
        case 'quit':
          deleteChannel(channel.id);
          break;
        case 'cancel':
          leaveChannel(channel.id);
          break;
        case 'invite':
        case 'revoke':
        case 'kick':
          break;
      }
    } catch (err) {
      return err instanceof Error ? err.message : 'Command failed';
    }
    return null;
  }

  return { execCommand };
}
