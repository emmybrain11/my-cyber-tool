import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      navigate("/login");
    },
    onError: (err) => {
      setError(err.message || "Registration failed.");
    },
  });

  const isSubmitting = registerMutation.status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Request Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[var(--text-primary)]">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-yellow)] outline-none"
              placeholder="Full name"
            />
            <label className="block text-sm font-medium text-[var(--text-primary)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-yellow)] outline-none"
              placeholder="user@school.edu"
            />
            <label className="block text-sm font-medium text-[var(--text-primary)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-yellow)] outline-none"
              placeholder="Strong password"
            />
            {error ? (
              <div className="rounded-md bg-[var(--bg-danger)] px-3 py-2 text-sm text-[var(--text-danger)]">
                {error}
              </div>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              onClick={() => registerMutation.mutate({ email, password, name })}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Access"}
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              The first four approved users receive admin access. After requesting access, an existing admin will approve your account.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Already have an account? <Link to="/login" className="font-semibold text-[var(--accent-yellow)]">Sign in</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
