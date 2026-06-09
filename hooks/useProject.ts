import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Member } from '@/types';

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectAndMembership = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw new Error('Project not found or access denied.');
        setProject(projectData);

        // 2. Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No active session. Please authenticate.');
        }

        // 3. Get all project members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('project_id', projectId);

        if (membersError) throw new Error(membersError.message);
        setMembers(membersData || []);

        // 4. Find the current user's membership
        const member = membersData?.find((m) => m.user_id === session.user.id);
        if (!member) {
          throw new Error('You are not a member of this project.');
        }
        setCurrentMember(member);

      } catch (err: any) {
        setError(err.message || 'An error occurred while loading project data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndMembership();

    // Subscribe to members table changes so that new joins appear instantly
    const channel = supabase
      .channel(`project_members_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
          filter: `project_id=eq.${projectId}`,
        },
        async () => {
          // Re-fetch members to ensure updated details
          const { data: membersData } = await supabase
            .from('members')
            .select('*')
            .eq('project_id', projectId);
          if (membersData) {
            setMembers(membersData);
            // Re-sync current member if their role changed
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const member = membersData.find((m) => m.user_id === session.user.id);
              if (member) setCurrentMember(member);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { project, currentMember, members, loading, error };
};
