'use strict';

import React, { Suspense } from 'react';
import LandingForm from '@/components/LandingForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md flex flex-col items-center z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8 space-y-1 select-none">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-3 animate-scale-up">
            <span className="text-xl font-bold text-white tracking-tighter">H</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-zinc-100 to-zinc-400">
            Hackboard
          </h1>
          <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
            Collaborative, real-time work coordination built for rapid hackathon teams.
          </p>
        </div>

        {/* Form component wrapped in Suspense for search params resolution safety */}
        <Suspense fallback={
          <div className="w-full bg-zinc-900/40 border border-zinc-900 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
            <span className="text-xs text-zinc-500 mt-4">Initializing workspace...</span>
          </div>
        }>
          <LandingForm />
        </Suspense>
      </div>

      {/* Footer metadata */}
      <div className="absolute bottom-4 text-[10px] text-zinc-600 font-semibold tracking-wide select-none">
        SECURE ANONYMOUS AUTHENTICATION ACTIVE
      </div>
    </main>
  );
}
