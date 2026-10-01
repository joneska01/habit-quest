import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-center font-pixel text-2xl leading-relaxed text-cloud [text-shadow:4px_4px_0_var(--color-ink)]">
        HABIT
        <br />
        QUEST
      </h1>
      <div className="pixel-card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
