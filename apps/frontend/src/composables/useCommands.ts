import { ref } from 'vue';
import { useChannels } from './useChannels';
import { useAuth } from './useAuth';

const showMemberList = ref(false);

export function useCommands() {
  const { currentUser } = useAuth();
  const {
    activeChannel,
    leaveChannel,
    joinChannel,
    inviteMember,
    deleteChannel,
    kickMember,
    revokeMember,
  } = useChannels();

  async function execCommand(commandStr: string): Promise<string | null> {
    const [cmd, ...args] = commandStr.slice(1).trim().split(/\s+/);
    const channel = activeChannel.value;

    if (!cmd || !currentUser.value) return null;

    try {
      if (cmd.toLowerCase() === 'join') {
        if (!args[0] || args.length > 2 || (args.length === 2 && args[1] !== 'private')) {
          return 'Usage: /join channelName [private]';
        }

        const type = args[1] === 'private' ? 'private' : 'public';

        await joinChannel(args[0], type);
        return null;
      }

      if (!channel) return 'Select a channel first';

      switch (cmd.toLowerCase()) {
        case 'quit':
          deleteChannel(channel.id);
          break;

        case 'cancel':
          leaveChannel(channel.id);
          break;

        case 'invite':
          if (args.length !== 1 || !args[0]) {
            return 'Usage: /invite nickname';
          }

          await inviteMember(channel.id, args[0]);
          break;

        case 'revoke':
          if (args.length !== 1 || !args[0]) {
            return 'Usage: /revoke nickName';
          }

          revokeMember(channel.id, args[0]);
          break;

        case 'kick':
          if (args.length !== 1 || !args[0]) {
            return 'Usage: /kick nickName';
          }

          kickMember(channel.id, args[0]);
          break;

        case 'list':
          showMemberList.value = !showMemberList.value;
          break;
      }
    } catch (err) {
      return err instanceof Error ? err.message : 'Command failed';
    }

    return null;
  }

  return { showMemberList, execCommand };
}
