import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  accentColor: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  onTaskClick,
  accentColor,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] md:min-w-[0] h-full bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 transition-colors duration-200 ${
        isOver ? 'bg-zinc-900/40 border-blue-500/20' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
          <h3 className="font-semibold text-zinc-100 text-sm tracking-wide">{title}</h3>
        </div>
        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar min-h-[200px]">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-900/60 rounded-xl p-8 text-center bg-zinc-900/5 transition-all duration-300">
            <p className="text-xs text-zinc-600 font-medium italic">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
};
