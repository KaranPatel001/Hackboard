import React, { useState } from 'react';
import { TaskLog, Task } from '@/types';
import { formatTimeAgo } from '@/utils/helpers';
import { Shield, ChevronRight, ChevronLeft, Activity, ListFilter, ArrowRight } from 'lucide-react';

interface ActivityFeedProps {
  logs: TaskLog[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, tasks, onTaskClick }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Take only the last 20 logs
  const displayLogs = logs.slice(0, 20);

  const getTaskTitle = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.title || 'deleted task';
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'text-zinc-500 bg-zinc-900 border-zinc-800';
    switch (status) {
      case 'todo':
        return 'text-zinc-400 bg-zinc-950 border-zinc-900';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/5 border-blue-500/10';
      case 'blocked':
        return 'text-red-400 bg-red-500/5 border-red-500/10';
      case 'done':
        return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
      default:
        return 'text-zinc-500 bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <div
      className={`h-full border-l border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col transition-all duration-300 relative ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-5 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors shadow-md z-20"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header */}
      <div className={`p-4 border-b border-zinc-900 flex items-center gap-2.5 overflow-hidden ${!isOpen ? 'justify-center' : ''}`}>
        <Activity className="w-4 h-4 text-blue-500 shrink-0" />
        {isOpen && (
          <div className="flex items-center justify-between w-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Activity Log</h3>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-zinc-500 font-bold rounded-full">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Logs list */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {displayLogs.length > 0 ? (
            displayLogs.map((log, index) => {
              const taskTitle = getTaskTitle(log.task_id);
              const initials = log.changed_by_member?.display_name
                ? log.changed_by_member.display_name.substring(0, 2).toUpperCase()
                : 'SYS';

              return (
                <div
                  key={`${log.id}-${index}`}
                  onClick={() => onTaskClick(log.task_id)}
                  className="group p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800/80 rounded-xl transition-all cursor-pointer space-y-2 select-none"
                >
                  {/* User profile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: log.changed_by_member?.avatar_color || '#52525B' }}
                      >
                        {initials}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-350">
                          {log.changed_by_member?.display_name || 'System'}
                        </span>
                        {log.changed_by_member?.role === 'admin' && (
                          <Shield className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-650">{formatTimeAgo(log.timestamp)}</span>
                  </div>

                  {/* Task details */}
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    <p className="line-clamp-2 text-zinc-300 font-medium group-hover:text-white transition-colors">
                      {taskTitle}
                    </p>
                  </div>

                  {/* Transition path */}
                  {log.old_status || log.new_status ? (
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
                      {log.old_status && (
                        <span className={`px-1.5 py-0.5 border rounded-md ${getStatusColor(log.old_status)}`}>
                          {log.old_status.replace('_', ' ')}
                        </span>
                      )}
                      {log.old_status && log.new_status && <ArrowRight className="w-2.5 h-2.5 text-zinc-600" />}
                      {log.new_status && (
                        <span className={`px-1.5 py-0.5 border rounded-md ${getStatusColor(log.new_status)}`}>
                          {log.new_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Custom Note description */}
                  {log.note && (
                    <p className="text-[10px] text-zinc-500 italic border-l border-zinc-800 pl-2 leading-relaxed truncate">
                      "{log.note}"
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-zinc-600 italic text-center">No activity logged yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-6 gap-6 overflow-hidden">
          {displayLogs.map((log, index) => {
            const initials = log.changed_by_member?.display_name
              ? log.changed_by_member.display_name.substring(0, 2).toUpperCase()
              : 'SYS';
            return (
              <div
                key={`${log.id}-${index}-collapsed`}
                onClick={() => onTaskClick(log.task_id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-inner cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: log.changed_by_member?.avatar_color || '#52525B' }}
                title={`${log.changed_by_member?.display_name || 'System'}: ${log.note || 'Updated status'}`}
              >
                {initials}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
