-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROJECTS TABLE
create table public.projects (
    id uuid default gen_random_uuid() primary key,
    name text not null check (char_length(name) >= 3),
    invite_code varchar(6) not null unique,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MEMBERS TABLE
create table public.members (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null check (role in ('admin', 'member')) default 'member',
    display_name text not null check (char_length(display_name) >= 2),
    avatar_color varchar(7) not null default '#3B82F6',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, user_id)
);

-- 3. TASKS TABLE
create table public.tasks (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    title text not null check (char_length(title) >= 3),
    description text,
    status text not null check (status in ('todo', 'in_progress', 'blocked', 'done')) default 'todo',
    priority text not null check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
    assigned_to uuid references public.members(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    due_time timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TASK LOGS TABLE
create table public.task_logs (
    id uuid default gen_random_uuid() primary key,
    task_id uuid references public.tasks(id) on delete cascade not null,
    changed_by uuid references auth.users(id) on delete set null,
    old_status text check (old_status in ('todo', 'in_progress', 'blocked', 'done')),
    new_status text check (new_status in ('todo', 'in_progress', 'blocked', 'done')),
    note text,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_projects_invite_code on public.projects(invite_code);
create index idx_members_project_user on public.members(project_id, user_id);
create index idx_tasks_project_status on public.tasks(project_id, status);
create index idx_task_logs_task_id on public.task_logs(task_id);

-- Auto-update updated_at helper trigger
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_tasks_modtime
    before update on public.tasks
    for each row execute function update_modified_column();

-- Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;

-- Helper security function: is user a member of project
create or replace function public.is_member_of_project(p_project_id uuid, p_user_id uuid)
returns boolean security definer as $$
begin
    return exists (
        select 1 from public.members
        where members.project_id = p_project_id
        and members.user_id = p_user_id
    );
end;
$$ language plpgsql;

-- 1. Projects Security Policies
create policy "Allow project read to members" on public.projects
    for select using (public.is_member_of_project(id, auth.uid()));

create policy "Allow authenticated users to create projects" on public.projects
    for insert with check (auth.uid() is not null);

-- 2. Members Security Policies
create policy "Members can view teammate profiles" on public.members
    for select using (public.is_member_of_project(project_id, auth.uid()));

create policy "Users can register themselves via functions" on public.members
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile" on public.members
    for update using (auth.uid() = user_id);

-- 3. Tasks Security Policies
create policy "Members can view tasks" on public.tasks
    for select using (public.is_member_of_project(project_id, auth.uid()));

create policy "Members can create tasks" on public.tasks
    for insert with check (public.is_member_of_project(project_id, auth.uid()));

create policy "Members can update tasks" on public.tasks
    for update using (public.is_member_of_project(project_id, auth.uid()));

create policy "Only project admins can delete tasks" on public.tasks
    for delete using (
        exists (
            select 1 from public.members
            where members.project_id = tasks.project_id
            and members.user_id = auth.uid()
            and members.role = 'admin'
        )
    );

-- 4. Task Logs Security Policies
create policy "Members can view task logs" on public.task_logs
    for select using (
        exists (
            select 1 from public.tasks
            where tasks.id = task_logs.task_id
            and public.is_member_of_project(tasks.project_id, auth.uid())
        )
    );

create policy "Members can insert task logs" on public.task_logs
    for insert with check (
        exists (
            select 1 from public.tasks
            where tasks.id = task_logs.task_id
            and public.is_member_of_project(tasks.project_id, auth.uid())
        )
    );

-- SECURITY DEFINER RPC: CREATE PROJECT
create or replace function public.create_project(
    p_project_name text,
    p_invite_code text,
    p_display_name text,
    p_avatar_color text
)
returns table (
    project_id uuid,
    project_name text,
    member_role text
) security definer as $$
declare
    v_project_id uuid;
begin
    -- Create the project
    insert into public.projects (name, invite_code, created_by)
    values (p_project_name, p_invite_code, auth.uid())
    returning id into v_project_id;

    -- Insert the creator as admin
    insert into public.members (project_id, user_id, role, display_name, avatar_color)
    values (v_project_id, auth.uid(), 'admin', p_display_name, p_avatar_color);

    return query select v_project_id, p_project_name, 'admin'::text;
end;
$$ language plpgsql;

-- SECURITY DEFINER RPC: JOIN PROJECT
create or replace function public.join_project(
    p_invite_code text,
    p_display_name text,
    p_avatar_color text
)
returns table (
    project_id uuid,
    project_name text,
    member_role text
) security definer as $$
declare
    v_project_id uuid;
    v_project_name text;
    v_role text;
begin
    -- Check if project exists
    select id, name into v_project_id, v_project_name
    from public.projects
    where invite_code = upper(p_invite_code);

    if v_project_id is null then
        raise exception 'Invalid invite code';
    end if;

    -- Check if already a member
    select role into v_role
    from public.members
    where members.project_id = v_project_id and members.user_id = auth.uid();

    -- If not a member, register
    if v_role is null then
        v_role := 'member';
        insert into public.members (project_id, user_id, role, display_name, avatar_color)
        values (v_project_id, auth.uid(), v_role, p_display_name, p_avatar_color);
    end if;

    return query select v_project_id, v_project_name, v_role;
end;
$$ language plpgsql;
