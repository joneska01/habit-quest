"use client";

import { useActionState } from "react";

import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-bold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          key={state.email}
          className="pixel-input"
        />
      </label>
      <label className="flex flex-col gap-1 font-bold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="pixel-input" />
      </label>
      {state.error && (
        <p role="alert" className="font-bold text-brick">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="pixel-btn">
        {pending ? "LOADING..." : "▶ PRESS START"}
      </button>
    </form>
  );
}
