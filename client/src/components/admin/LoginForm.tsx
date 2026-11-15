import { Loader2, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.adminLogin(password);
      onSuccess();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) setError("That password is not correct.");
      else if (caught instanceof ApiError && caught.status === 429)
        setError("Too many attempts. Please wait a few minutes and try again.");
      else setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[60svh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <span className="bg-brand-soft text-primary mb-6 grid size-14 place-items-center rounded-2xl">
        <Lock className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-extrabold">Admin sign-in</h1>
      <p className="text-muted-foreground mt-2">
        Funnel analytics and leads for the Path Generator.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-error" : undefined}
            className="mt-2 h-11"
          />
        </div>

        {error && (
          <Alert variant="destructive" id="admin-error" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="xl" className="w-full" disabled={busy || password.length === 0}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </section>
  );
}
