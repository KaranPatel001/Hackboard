'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProject';
import { useTasks } from '@/hooks/useTasks';
import { usePresence } from '@/hooks/usePresence';
import { MemberPresence } from '@/components/MemberPresence';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskDetailDrawer, CreateTaskModal } from '@/components/TaskModal';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Task, TaskStatus, TaskPriority } from '@/types';

// dnd-kit imports
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';

import {
  Kanban,
  List,
  Plus,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Shield,
  Clock,
  Play,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  // 1. Load Custom Hooks
  const { project, currentMember, members, loading: projectLoading, error: projectError } = useProject(projectId);
  const {
    tasks,
    logs,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTaskStatus,
    claimTask,
    assignTask,
  } = useTasks(projectId, members, currentMember);
  const { onlineUsers } = usePresence(projectId, currentMember);

  // 2. Local UI State
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Configure sensors for drag and drop to not intercept simple clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag starts only after moving 8px (crucial for clicking to open detail)
      },
    })
  );

  // Helper to trigger custom toasts
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 3. Handle Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === newStatus) return;

    try {
      await updateTaskStatus(taskId, newStatus, `Dragged to ${newStatus.replace('_', ' ')}`);
      addToast(`Task moved to ${newStatus.replace('_', ' ')}!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update task status.', 'error');
    }
  };

  // 4. Calculations
  const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const percentage = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  // Loading indicator screen
  if (projectLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
        <span className="text-xs text-zinc-500 mt-4 tracking-wider">Syncing room details...</span>
      </div>
    );
  }

  // Error boundary page
  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-bold text-zinc-200">Access Restricted</h2>
        <p className="text-xs text-zinc-500 max-w-sm">
          {projectError || 'The requested project room does not exist or you are not registered.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-350 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-850 hover:text-zinc-200 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleTaskClickById = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsDetailOpen(true);
    }
  };

  // Helper for quick status rendering colors
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'blocked':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'done':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-100">
      {/* Presence and completion header */}
      <MemberPresence
        projectName={project.name}
        inviteCode={project.invite_code}
        onlineUsers={onlineUsers}
        percentage={percentage}
        currentMember={currentMember}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasksTotal}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Core Task Board Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* View Mode Switcher Toggle */}
            <div className="flex items-center p-1 bg-zinc-950 border border-zinc-900 rounded-xl">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-zinc-900 text-zinc-100 shadow border border-zinc-850'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-zinc-900 text-zinc-100 shadow border border-zinc-850'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>

            {/* Admin Add Task Button */}
            {currentMember?.role === 'admin' && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-blue-600/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>

          {/* VIEW RENDERING */}
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20 max-w-lg mx-auto w-full my-auto">
              <FolderOpen className="w-10 h-10 text-zinc-700 mb-3" />
              <h3 className="font-semibold text-zinc-300 text-sm">No tasks scoped yet</h3>
              <p className="text-xs text-zinc-650 mt-1 max-w-xs leading-relaxed">
                {currentMember?.role === 'admin'
                  ? 'Get started by creating your first task for the MVP using the button above!'
                  : 'Waiting for project Leads to scope and distribute tasks.'}
              </p>
              {currentMember?.role === 'admin' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition-all"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            /* KANBAN BOARD WITH DND-KIT */
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-start overflow-x-auto pb-4">
                <KanbanColumn
                  id="todo"
                  title="To Do"
                  accentColor="bg-zinc-500"
                  tasks={tasks.filter((t) => t.status === 'todo')}
                  onTaskClick={handleTaskClick}
                />
                <KanbanColumn
                  id="in_progress"
                  title="In Progress"
                  accentColor="bg-blue-500"
                  tasks={tasks.filter((t) => t.status === 'in_progress')}
                  onTaskClick={handleTaskClick}
                />
                <KanbanColumn
                  id="blocked"
                  title="Blocked"
                  accentColor="bg-red-500"
                  tasks={tasks.filter((t) => t.status === 'blocked')}
                  onTaskClick={handleTaskClick}
                />
                <KanbanColumn
                  id="done"
                  title="Done"
                  accentColor="bg-emerald-500"
                  tasks={tasks.filter((t) => t.status === 'done')}
                  onTaskClick={handleTaskClick}
                />
              </div>
            </DndContext>
          ) : (
            /* FLAT LIST DENSE VIEW */
            <div className="flex-1 border border-zinc-900 rounded-2xl bg-zinc-950/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500 font-bold uppercase tracking-wider select-none">
                      <th className="p-4">Task Title</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 bg-zinc-900/10">
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-medium text-zinc-200 max-w-xs truncate">{task.title}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border text-[10px] font-semibold uppercase rounded-md ${getStatusBadge(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold uppercase text-[10px] ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          {task.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: task.assignee.avatar_color }}
                              >
                                {task.assignee.display_name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-zinc-350">{task.assignee.display_name}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {!task.assigned_to ? (
                            <button
                              onClick={() => {
                                claimTask(task.id);
                                addToast('Task claimed successfully!', 'success');
                              }}
                              className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20 rounded-lg transition-colors text-[10px]"
                            >
                              Claim Task
                            </button>
                          ) : (
                            <span className="text-zinc-650 font-medium">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Global changelog feed drawer/sidebar */}
        <ActivityFeed logs={logs} tasks={tasks} onTaskClick={handleTaskClickById} />
      </div>

      {/* Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        members={members}
        onCreate={async (title, desc, priority, assignTo, due) => {
          const res = await createTask(title, desc, priority, assignTo, due);
          addToast('Task created successfully!', 'success');
          return res;
        }}
      />

      {/* Task Details Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        members={members}
        currentMember={currentMember}
        onUpdateStatus={async (taskId, status, note) => {
          await updateTaskStatus(taskId, status, note);
          addToast(`Task updated to ${status.replace('_', ' ')}!`, 'success');
        }}
        onClaim={async (taskId) => {
          await claimTask(taskId);
          addToast('Task assigned to you!', 'success');
        }}
        onAssign={async (taskId, memberId) => {
          await assignTask(taskId, memberId);
          addToast('Task assignee changed!', 'success');
        }}
        taskLogs={logs}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 border rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-slide-in pointer-events-auto ${
              toast.type === 'error'
                ? 'bg-red-950/80 border-red-500/30 text-red-300'
                : toast.type === 'info'
                ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                : 'bg-zinc-900/90 border-blue-500/20 text-zinc-100'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            )}
            <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
