import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Task } from '@/types';
import { formatTimeAgo } from '@/utils/helpers';
import { Shield, HelpCircle, AlertTriangle, Play, CheckCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />;
      case 'in_progress':
        return <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />;
      case 'blocked':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400 fill-red-400/20" />;
      case 'done':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />;
      default:
        return null;
    }
  };

  // Safe avatar character getter
  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '?';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(task)}
      className={`group relative flex flex-col gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${
        isDragging ? 'opacity-40 border-dashed border-blue-500/50 shadow-2xl scale-[1.02]' : ''
      }`}
    >
      {/* Card Header: Priority & Status indicator */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border rounded-md ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(task.status)}
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-zinc-100 group-hover:text-white line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Card Footer: Assignee Avatar & Time Ago */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-1">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner relative"
              style={{ backgroundColor: task.assignee.avatar_color }}
              title={`${task.assignee.display_name} (${task.assignee.role})`}
            >
              {getInitials(task.assignee.display_name)}
              {task.assignee.role === 'admin' && (
                <div className="absolute -bottom-1 -right-1 bg-zinc-950 p-0.5 rounded-full border border-zinc-800">
                  <Shield className="w-2.5 h-2.5 text-amber-400" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 font-medium italic">
              --
            </div>
          )}
          <span className="text-xs text-zinc-400 truncate max-w-[100px]">
            {task.assignee ? task.assignee.display_name : 'Unassigned'}
          </span>
        </div>

        <span className="text-[10px] text-zinc-500 font-medium">
          {formatTimeAgo(task.updated_at)}
        </span>
      </div>
    </div>
  );
};
