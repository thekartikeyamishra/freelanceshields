// app/loading.tsx
//
// CHANGED: removed the theatre. The previous version displayed
//   "Initializing secure local environment..."
//   "verifying_local_storage"   (monospace, bottom of screen)
// Nothing was being initialised or verified. It was invented technical
// vocabulary shown during a route transition to imply security work was
// happening. That is the same instinct as the scanner's two-second fake delay,
// and it is the kind of detail that costs you credibility when someone notices.
//
// A loading state should say what is loading, or say nothing.

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Loader2
        size={28}
        aria-hidden="true"
        className="animate-spin text-brand-600 motion-reduce:animate-none"
      />
      <p role="status" className="mt-4 text-sm font-medium text-slate-500">
        Loading
      </p>
    </div>
  );
}
