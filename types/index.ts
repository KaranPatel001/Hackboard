export interface Project {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string;
  created_at: string;
}

export interface Member {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'member';
  display_name: string;
  avatar_color: string;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string; // member.id
  created_by?: string;
  due_time?: string;
  created_at: string;
  updated_at: string;
  
  // Joined field for convenience
  assignee?: Member | null;
}

export interface TaskLog {
  id: string;
  task_id: string;
  changed_by: string; // auth.uid()
  old_status?: TaskStatus | null;
  new_status?: TaskStatus | null;
  note?: string | null;
  timestamp: string;
  
  // Joined field for display
  changed_by_member?: Member | null;
}
