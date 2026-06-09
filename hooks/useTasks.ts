import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, TaskLog, TaskStatus, TaskPriority, Member } from '@/types';

export const useTasks = (
  projectId: string | undefined,
  members: Member[],
  currentMember: Member | null
) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid recreating subscription functions when state changes
  const membersRef = useRef<Member[]>(members);
  membersRef.current = members;

  // 1. Fetch initial tasks and task logs
  const fetchTasksAndLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('task_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      // Map assignee and changed_by objects
      const mappedTasks = (tasksData || []).map((t: Task) => ({
        ...t,
        assignee: membersRef.current.find((m) => m.id === t.assigned_to) || null,
      }));

      // Filter logs related to project tasks
      const projectTaskIds = mappedTasks.map((t) => t.id);
      const filteredLogs = (logsData || [])
        .filter((l: TaskLog) => projectTaskIds.includes(l.task_id))
        .map((l: TaskLog) => ({
          ...l,
          changed_by_member: membersRef.current.find((m) => m.user_id === l.changed_by) || null,
        }));

      setTasks(mappedTasks);
      setLogs(filteredLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasksAndLogs();
  }, [fetchTasksAndLogs]);

  // 2. Real-time Subscription logic
  useEffect(() => {
    if (!projectId) return;

    const tasksChannel = supabase
      .channel(`tasks_channel_${projectId}`)
      // Listen to TASKS changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            const mapped: Task = {
              ...newTask,
              assignee: membersRef.current.find((m) => m.id === newTask.assigned_to) || null,
            };
            setTasks((prev) => {
              if (prev.some((t) => t.id === mapped.id)) return prev;
              return [...prev, mapped];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) =>
                t.id === updated.id
                  ? {
                      ...t,
                      ...updated,
                      assignee: membersRef.current.find((m) => m.id === updated.assigned_to) || null,
                    }
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setTasks((prev) => prev.filter((t) => t.id !== deleted.id));
          }
        }
      )
      // Listen to TASK LOGS changes (global sync)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_logs',
        },
        async (payload) => {
          const newLog = payload.new as TaskLog;
          // Only add if the task belongs to this project
          setTasks((currTasks) => {
            const isProjectTask = currTasks.some((t) => t.id === newLog.task_id);
            if (isProjectTask) {
              const mappedLog: TaskLog = {
                ...newLog,
                changed_by_member: membersRef.current.find((m) => m.user_id === newLog.changed_by) || null,
              };
              setLogs((prev) => {
                if (prev.some((l) => l.id === mappedLog.id)) return prev;
                return [mappedLog, ...prev];
              });
            }
            return currTasks;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [projectId]);

  // Helper function: Insert a Task Log manually
  const insertTaskLog = async (taskId: string, oldStatus: TaskStatus | null, newStatus: TaskStatus | null, note: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from('task_logs').insert({
      task_id: taskId,
      changed_by: session.user.id,
      old_status: oldStatus,
      new_status: newStatus,
      note: note,
    });
  };

  // 3. Create Task (Admin only in UX, but checked in RLS)
  const createTask = async (
    title: string,
    description: string,
    priority: TaskPriority,
    assignedToId?: string,
    dueTime?: string
  ) => {
    if (!projectId) return;

    const { data: { session } } = await supabase.auth.getSession();
    const createdBy = session?.user?.id || null;

    const { data, error: createError } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title,
        description,
        priority,
        assigned_to: assignedToId || null,
        created_by: createdBy,
        due_time: dueTime || null,
        status: 'todo',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log the creation
    if (data) {
      await insertTaskLog(data.id, null, 'todo', 'Task created');
    }
    return data;
  };

  // 4. Update Task Status (with optimistic updates)
  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    note: string = ''
  ) => {
    // Find previous state in case of rollback
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const previousTask = tasks[taskIndex];
    const oldStatus = previousTask.status;

    if (oldStatus === newStatus) return;

    // Optimistically update local tasks list
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Log the transition
      const logNote = note || `Moved task from ${oldStatus} to ${newStatus}`;
      await insertTaskLog(taskId, oldStatus, newStatus, logNote);
    } catch (err: any) {
      // Rollback to previous status on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus, updated_at: previousTask.updated_at } : t))
      );
      throw new Error(err.message || 'Failed to update task status.');
    }
  };

  // 5. Claim Task ("Assign to Me")
  const claimTask = async (taskId: string) => {
    if (!currentMember) throw new Error('Not logged in as project member');

    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const previousTask = tasks[taskIndex];

    // Optimistically assign
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigned_to: currentMember.id,
              assignee: currentMember,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      const { error: assignError } = await supabase
        .from('tasks')
        .update({ assigned_to: currentMember.id })
        .eq('id', taskId);

      if (assignError) throw assignError;

      // Log assignment
      await insertTaskLog(taskId, null, null, `Assigned to ${currentMember.display_name}`);
    } catch (err: any) {
      // Rollback assignment
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                assigned_to: previousTask.assigned_to,
                assignee: previousTask.assignee,
                updated_at: previousTask.updated_at,
              }
            : t
        )
      );
      throw new Error(err.message || 'Failed to claim task.');
    }
  };

  // 6. Force Assign (Admin only)
  const assignTask = async (taskId: string, memberId: string | null) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const previousTask = tasks[taskIndex];
    const newAssignee = membersRef.current.find((m) => m.id === memberId) || null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigned_to: memberId || undefined,
              assignee: newAssignee,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      const { error: assignError } = await supabase
        .from('tasks')
        .update({ assigned_to: memberId })
        .eq('id', taskId);

      if (assignError) throw assignError;

      const logMsg = memberId
        ? `Assigned to ${newAssignee?.display_name || 'unknown'}`
        : 'Unassigned task';
      await insertTaskLog(taskId, null, null, logMsg);
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                assigned_to: previousTask.assigned_to,
                assignee: previousTask.assignee,
                updated_at: previousTask.updated_at,
              }
            : t
        )
      );
      throw new Error(err.message || 'Failed to assign task.');
    }
  };

  return {
    tasks,
    logs,
    loading,
    error,
    createTask,
    updateTaskStatus,
    claimTask,
    assignTask,
    refetch: fetchTasksAndLogs,
  };
};
