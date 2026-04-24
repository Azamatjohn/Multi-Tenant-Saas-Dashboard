export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-16">
        <div className="text-white text-xl font-semibold tracking-tight">
          NexusHQ
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-white text-4xl font-semibold leading-tight">
              The workspace your team actually uses
            </h2>
            <p className="text-slate-400 text-lg">
              Manage your team, track usage, and scale your plan — all in one place.
            </p>
          </div>
          <ul className="space-y-4">
            {["Free 14-day trial", "No credit card required", "Cancel anytime"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300 text-base">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-slate-500 text-sm">© 2026 NexusHQ. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center min-h-screen p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}