'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateInviteCode, getRandomAvatarColor } from '@/utils/helpers';
import { PlusCircle, Link, ArrowRight, User, AlertCircle } from 'lucide-react';

export default function LandingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create Project inputs
  const [projectName, setProjectName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  
  // Join Project inputs
  const [inviteCode, setInviteCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate invite code if passed in query params
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code.toUpperCase().substring(0, 6));
      setActiveTab('join');
    }
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim().length < 3 || createDisplayName.trim().length < 2) {
      setError('Project name must be >= 3 chars, and Display name >= 2 chars.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // 1. Sign in anonymously
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      // 2. Setup project params
      const code = generateInviteCode();
      const color = getRandomAvatarColor();

      // 3. Invoke create_project RPC
      const { data, error: rpcError } = await supabase.rpc('create_project', {
        p_project_name: projectName.trim(),
        p_invite_code: code,
        p_display_name: createDisplayName.trim(),
        p_avatar_color: color,
      });

      if (rpcError) throw rpcError;
      
      const newProjectId = data[0]?.project_id;
      if (!newProjectId) throw new Error('Failed to resolve created project ID.');

      router.push(`/dashboard/${newProjectId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during project creation.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim().length !== 6 || joinDisplayName.trim().length < 2) {
      setError('Invite code must be exactly 6 characters, and Display name >= 2 chars.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Sign in anonymously
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      const color = getRandomAvatarColor();

      // 2. Invoke join_project RPC
      const { data, error: rpcError } = await supabase.rpc('join_project', {
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_display_name: joinDisplayName.trim(),
        p_avatar_color: color,
      });

      if (rpcError) throw rpcError;

      const joinedProjectId = data[0]?.project_id;
      if (!joinedProjectId) throw new Error('Project not found or invite code expired.');

      router.push(`/dashboard/${joinedProjectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join project workspace. Check your invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 animate-scale-up">
      {/* Navigation tabs */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-900 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab('create');
            setError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'create'
              ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Create Room
        </button>
        <button
          onClick={() => {
            setActiveTab('join');
            setError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'join'
              ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          Join Room
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CREATE TAB FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest flex items-center gap-1">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g., Team Alpha Solver"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-850 rounded-xl text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-blue-500/50 transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-650" />
              Your Display Name
            </label>
            <input
              type="text"
              placeholder="e.g., Jane (Frontend)"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-850 rounded-xl text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-blue-500/50 transition-colors"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                Initialize Project Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* JOIN TAB FORM */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">Invite Join Code</label>
            <input
              type="text"
              placeholder="6-character alphanumeric code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-850 rounded-xl text-sm text-zinc-100 font-mono tracking-widest placeholder-zinc-700 outline-none focus:border-blue-500/50 transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-650" />
              Your Display Name
            </label>
            <input
              type="text"
              placeholder="e.g., Alex (DevOps)"
              value={joinDisplayName}
              onChange={(e) => setJoinDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-850 rounded-xl text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-blue-500/50 transition-colors"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                Join Project Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
