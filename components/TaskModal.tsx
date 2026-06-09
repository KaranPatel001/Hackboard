import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority, Member, TaskLog } from '@/types';
import { formatTimeAgo } from '@/utils/helpers';
import { X, Shield, Calendar, AlignLeft, UserPlus, Clock, MessageSquare, AlertCircle } from 'lucide-react';

// ==========================================
// 1. CREATE TASK MODAL (ADMIN ONLY)
// ==========================================
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onCreate: (
    title: string,
    description: string,
    priority: TaskPriority,
    assignedToId?: string,
    dueTime?: string
  ) => Promise<any>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  members,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(
        title.trim(),
        description.trim(),
        priority,
        assignedTo || undefined,
        dueTime || undefined
      );
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo('');
      setDueTime('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <h3 className="text-base font-semibold text-zinc-150 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Create Workspace Task
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Task Title</label>
            <input
              type="text"
              placeholder="e.g., Setup database schema and initial migration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</label>
            <textarea
              placeholder="Provide a description or technical tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-100 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-100 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Due Time (Optional)</label>
            <input
              type="datetime-local"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-100 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-sm font-semibold text-white rounded-xl transition-colors shadow-lg shadow-blue-600/15"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. TASK DETAIL SLIDE-OVER (DRAWER)
// ==========================================
interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentMember: Member | null;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, note: string) => Promise<void>;
  onClaim: (taskId: string) => Promise<void>;
  onAssign: (taskId: string, memberId: string | null) => Promise<void>;
  taskLogs: TaskLog[];
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  members,
  currentMember,
  onUpdateStatus,
  onClaim,
  onAssign,
  taskLogs,
}) => {
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setNote('');
      setError(null);
    }
  }, [task]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  // Filter logs for this task
  const currentTaskLogs = taskLogs.filter((log) => log.task_id === task.id);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setStatus(newStatus);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdateStatus(task.id, status, note.trim());
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleClaim = async () => {
    setUpdating(true);
    setError(null);
    try {
      await onClaim(task.id);
    } catch (err: any) {
      setError(err.message || 'Failed to claim task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignChange = async (memberId: string) => {
    setUpdating(true);
    setError(null);
    try {
      await onAssign(task.id, memberId || null);
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '?';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-400/10 border-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'low':
      default:
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div
        ref={drawerRef}
        className="w-full max-w-md md:max-w-lg bg-zinc-900 border-l border-zinc-850 shadow-2xl flex flex-col h-full animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Task details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title and Priority */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase border rounded-md ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs text-zinc-500">Updated {formatTimeAgo(task.updated_at)}</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 leading-snug">{task.title}</h2>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Description
            </h4>
            <p className="text-sm text-zinc-300 bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
              {task.description || <span className="italic text-zinc-655 font-medium">No description provided.</span>}
            </p>
          </div>

          {/* Assignments */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Assignee
              </h4>
              {currentMember?.role === 'admin' ? (
                <select
                  value={task.assigned_to || ''}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {task.assignee ? (
                    <>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{ backgroundColor: task.assignee.avatar_color }}
                      >
                        {getInitials(task.assignee.display_name)}
                      </div>
                      <span className="text-xs text-zinc-200 font-medium">{task.assignee.display_name}</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 italic">Unassigned</span>
                      <button
                        onClick={handleClaim}
                        disabled={updating}
                        className="px-2.5 py-1 text-[10px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20 rounded-lg transition-colors"
                      >
                        Assign to Me
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status updates */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Status
              </h4>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Due Time metadata if present */}
          {task.due_time && (
            <div className="p-3 bg-zinc-950/30 border border-zinc-850 rounded-xl flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <div className="text-xs">
                <span className="text-zinc-500">Due date: </span>
                <span className="text-zinc-350 font-medium">{new Date(task.due_time).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Optional update note log input */}
          {status !== task.status && (
            <div className="p-4 bg-zinc-950/60 border border-blue-500/10 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
                <MessageSquare className="w-4 h-4" />
                <span>Status Change Note</span>
              </div>
              <input
                type="text"
                placeholder="Explain the update (e.g. blockers, progress details)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-150 placeholder-zinc-700 outline-none focus:border-blue-500/40 transition-colors"
              />
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setStatus(task.status)}
                  className="text-[10px] text-zinc-400 font-semibold hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-3 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  {updating ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </div>
          )}

          {/* Activity Logs inside panel */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Activity Feed
            </h4>
            <div className="relative border-l border-zinc-800 ml-2.5 pl-4 space-y-4 max-h-[200px] overflow-y-auto no-scrollbar">
              {currentTaskLogs.length > 0 ? (
                currentTaskLogs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="relative text-xs">
                    {/* Tiny bullet marker */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 bg-zinc-750" />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-200">
                          {log.changed_by_member?.display_name || 'System'}
                        </span>
                        {log.changed_by_member?.role === 'admin' && (
                          <Shield className="w-3 h-3 text-amber-400" />
                        )}
                        <span className="text-[10px] text-zinc-550">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {log.note || `Transitioned status to ${log.new_status}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-[11px] text-zinc-600 italic">No updates logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
