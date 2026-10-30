"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="username" className="mb-1.5 block font-medium">
          Username
        </label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={50} required className="field" defaultValue={state.username} key={state.username} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <div role="status" aria-live="polite" className="min-h-[1.5rem]">
        {state.error && (
          <p role="alert" className="font-medium text-[#9b3d52]">
            {state.error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
