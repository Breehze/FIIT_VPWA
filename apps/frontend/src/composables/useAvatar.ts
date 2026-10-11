import { useAuth } from '@/composables/useAuth';
import type { User } from '@vpwa/shared';

const avatarColors = [
  '#ffaacf', // Blush 300
  '#fbb882', // Peach 300
  '#86eba9', // Mint 300
  '#8dc8ff', // Sky 300
];

const offlineAvatarColor = '#E8DDF5';
const activeUserColor = '#c9b3ff';

export function useAvatar() {
  const { currentUser } = useAuth();

  function getAvatarColor(member: User, showDndColor = false): string {
    if (showDndColor && member.state === 'Offline') {
      return offlineAvatarColor;
    }

    if (member.id === currentUser.value?.id) {
      return activeUserColor;
    }

    let hash = 0;

    for (let i = 0; i < member.id.length; i++) {
      hash += member.id.charCodeAt(i);
    }

    return avatarColors[hash % avatarColors.length]!;
  }
  return { getAvatarColor };
}
