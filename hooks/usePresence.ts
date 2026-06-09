import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types';

export interface PresenceState {
  user_id: string;
  display_name: string;
  avatar_color: string;
  role: string;
  online_at: string;
}

export const usePresence = (projectId: string | undefined, currentMember: Member | null) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!projectId || !currentMember) return;

    const channel = supabase.channel(`presence:${projectId}`, {
      config: {
        presence: {
          key: currentMember.user_id,
        },
      },
    });

    const handleSync = () => {
      const state = channel.presenceState();
      const onlineList: PresenceState[] = [];

      Object.keys(state).forEach((key) => {
        const userPresences = state[key] as any[];
        if (userPresences && userPresences.length > 0) {
          // Take the latest presence record for this user
          const latest = userPresences[userPresences.length - 1];
          onlineList.push({
            user_id: key,
            display_name: latest.display_name,
            avatar_color: latest.avatar_color,
            role: latest.role,
            online_at: latest.online_at,
          });
        }
      });

      // Sort by online time or name
      onlineList.sort((a, b) => a.display_name.localeCompare(b.display_name));
      setOnlineUsers(onlineList);
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Optional: Trigger toast or notification when user joins
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Optional: Trigger toast or notification when user leaves
        console.log('leave', key, leftPresences);
      });

    // Track self presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          display_name: currentMember.display_name,
          avatar_color: currentMember.avatar_color,
          role: currentMember.role,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, currentMember]);

  return { onlineUsers };
};
