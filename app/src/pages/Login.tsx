import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      navigate("/");
    },
    onError: (err) => {
      setError(err.message ?? "Login failed. Check your credentials.");
    },
  });

  const isSubmitting = loginMutation.status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Secure Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-yellow)] outline-none"
              placeholder="admin@example.com"
            />
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-yellow)] outline-none"
              placeholder="********"
            />
            {error ? (
              <div className="rounded-md bg-[var(--bg-danger)] px-3 py-2 text-sm text-[var(--text-danger)]">
                {error}
              </div>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setError(null);
                loginMutation.mutate({ email, password });
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              New here? <Link to="/register" className="font-semibold text-[var(--accent-yellow)]">Request access</Link> and the first four approved users will receive admin access.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              This security-first system is built by 🔏emmy-brain-codes🛰️ for safe lab training.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
