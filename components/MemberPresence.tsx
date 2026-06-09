import React, { useState } from 'react';
import { PresenceState } from '@/hooks/usePresence';
import { Member } from '@/types';
import { Copy, Check, Users, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MemberPresenceProps {
  projectName: string;
  inviteCode: string;
  onlineUsers: PresenceState[];
  percentage: number;
  currentMember: Member | null;
  tasksCompleted: number;
  tasksTotal: number;
}

export const MemberPresence: React.FC<MemberPresenceProps> = ({
  projectName,
  inviteCode,
  onlineUsers,
  percentage,
  currentMember,
  tasksCompleted,
  tasksTotal,
}) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    try {
      // Create join link representation
      const joinLink = `${window.location.origin}/?code=${inviteCode}`;
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleLeaveProject = async () => {
    if (confirm('Are you sure you want to sign out of this project workspace?')) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '?';
  };

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Project Title and Invite Code */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-100 tracking-wide">{projectName}</h1>
          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider uppercase rounded-full">
            Active Workspace
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-zinc-500">Invite Code:</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-850 rounded-lg text-xs font-mono text-zinc-350 hover:text-zinc-200 transition-all active:scale-[0.98]"
            title="Click to copy invite join link"
          >
            <span>{inviteCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>
        </div>
      </div>

      {/* Progress & Metrics */}
      <div className="flex flex-col gap-1.5 max-w-xs w-full">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold tracking-wide uppercase text-[10px] text-zinc-500">Project Completion</span>
          <span className="font-mono font-bold text-zinc-300">
            {tasksCompleted}/{tasksTotal} done ({percentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Presence & Current User profile */}
      <div className="flex items-center gap-4">
        {/* Presence Avatars */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <Users className="w-3 h-3 text-zinc-500" />
            <span>Online now ({onlineUsers.length})</span>
          </div>
          <div className="flex items-center -space-x-1.5">
            {onlineUsers.map((user) => (
              <div
                key={user.user_id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-zinc-950 relative shadow-inner group cursor-default transition-transform hover:scale-110 hover:z-30"
                style={{ backgroundColor: user.avatar_color }}
                title={`${user.display_name} (${user.role})`}
              >
                {getInitials(user.display_name)}
                {/* Green presence indicator */}
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950 shadow" />
              </div>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-8 bg-zinc-850" />

        {/* Current user role profile card */}
        {currentMember && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-250 flex items-center justify-end gap-1.5">
                {currentMember.display_name}
                {currentMember.role === 'admin' && <Shield className="w-3 h-3 text-amber-400" />}
              </span>
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest">{currentMember.role}</span>
            </div>
            <button
              onClick={handleLeaveProject}
              className="p-2 bg-zinc-900 border border-zinc-850 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all active:scale-[0.96]"
              title="Sign out of project"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
