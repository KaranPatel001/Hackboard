# Hackboard - Hackathon Project Manager 🚀

**🌐 Live Demo:** [https://hackboard.vercel.app/](https://hackboard.vercel.app/)

Hackboard is a modern, real-time project management tool built specifically for hackathons and fast-paced agile teams. It provides a collaborative environment with live presence tracking, a dynamic drag-and-drop Kanban board, and activity feeds.

## ✨ Features

- **Real-Time Kanban Board**: Drag and drop tasks effortlessly across columns using `@dnd-kit`. Updates sync instantly across all clients.
- **Live Member Presence**: See who is currently online and active in the project dashboard, powered by Supabase Realtime.
- **Activity Feed**: Keep track of every action in the project. The activity stream logs task creations, status updates, and modifications.
- **Dynamic Projects Dashboard**: Manage multiple hackathon or side-projects under dedicated workspaces.
- **Task Modals**: Expand tasks to view and edit details, descriptions, and assignees.
- **Supabase Backend**: Fully authenticated and securely stored using Supabase PostgreSQL, leveraging Row Level Security (RLS) for data privacy.
- **Modern UI**: Styled with Tailwind CSS v4 and standard scalable UI components built on `clsx` and `tailwind-merge` featuring `lucide-react` icons.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/) 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Realtime**: [Supabase](https://supabase.com/)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js installed, as well as a Supabase project created.

### Environment Setup

Create a `.env.local` file in the root of the project with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Setup

The initial database migrations are located at `supabase/migrations/001_init.sql`. You can apply these to your remote Supabase project to generate the required tables:
- `Projects`
- `Tasks`
- `Activities`
- `Profiles` (or Users)

*This project was bootstrapped with [`create-next-app`](https://github.com/vercel/next.js)*.
