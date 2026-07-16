import { UserProfile } from "@clerk/nextjs";
import { isAuthV2Available } from "@/lib/authV2";

export default function AuthV2AccountPage() {
  if (!isAuthV2Available()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-brand-ink">Auth Preview Not Configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the Clerk environment variables and set `AUTH_V2_ENABLED=true` before using the
            account settings preview.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(26,111,196,0.18),_transparent_40%),linear-gradient(180deg,_#f7fbff_0%,_#eef3f9_100%)] px-4 py-10">
      <UserProfile path="/auth-v2/account" routing="path" />
    </main>
  );
}
