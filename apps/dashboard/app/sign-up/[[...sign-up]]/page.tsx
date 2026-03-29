import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            SupportAI
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            AI-powered customer support that resolves tickets instantly.
          </p>

          <ul className="mt-10 space-y-5">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white">Resolve 80% of tickets with AI</p>
                <p className="text-sm text-zinc-500">
                  Accurate answers from your knowledge base, 24/7.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white">5-minute setup</p>
                <p className="text-sm text-zinc-500">
                  Upload your docs, embed the widget, and you are live.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white">Predictable pricing</p>
                <p className="text-sm text-zinc-500">
                  Flat-rate plans starting at $49/mo. No per-ticket fees.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Sign-up form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SupportAI
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              AI-powered customer support
            </p>
          </div>

          <SignUp
            forceRedirectUrl="/pricing"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-zinc-900 border-zinc-800 shadow-2xl",
                headerTitle: "text-white",
                headerSubtitle: "text-zinc-400",
                socialButtonsBlockButton:
                  "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                formFieldLabel: "text-zinc-300",
                formFieldInput:
                  "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500",
                footerActionLink: "text-emerald-400 hover:text-emerald-300",
                formButtonPrimary:
                  "bg-white text-zinc-900 hover:bg-zinc-200",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
