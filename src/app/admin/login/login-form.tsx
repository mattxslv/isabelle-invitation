"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state.email} key={state.email} />
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
