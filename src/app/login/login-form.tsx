"use client";

import { useActionState, useRef } from "react";

import { login, type LoginState } from "./actions";

/** Typing, deleting and pasting report these; password-manager autofill doesn't. */
function isManualEdit(event: Event): boolean {
  const inputType = (event as InputEvent).inputType ?? "";
  return /^(insert(Text|FromPaste|FromDrop|CompositionText|LineBreak)|delete|historyUndo|historyRedo)/.test(inputType);
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const autoSubmitted = useRef(false);

  // Auto-press START when a password manager (Keychain / Face ID / browser) fills the
  // form. Fires once per page load so a wrong saved password can't loop.
  // Listens on the form so it works whichever field autofill fills last.
  function onFormInput(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    if (autoSubmitted.current || isManualEdit(event.nativeEvent)) return;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    const password = form.elements.namedItem("password") as HTMLInputElement;
    if (email.value && password.value) {
      autoSubmitted.current = true;
      form.requestSubmit();
    }
  }

  return (
    <form action={formAction} onInput={onFormInput} className="flex flex-col gap-4">
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
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="pixel-input"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-bold text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="pixel-btn">
        {pending ? "LOADING..." : "▶ PRESS START"}
      </button>
    </form>
  );
}
