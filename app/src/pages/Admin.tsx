import { useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const pendingQuery = trpc.admin.pendingUsers.useQuery(undefined, { refetchInterval: 10000 });
  const allUsersQuery = trpc.admin.allUsers.useQuery(undefined);
  const approveMutation = trpc.admin.approveUser.useMutation({ onSuccess: () => pendingQuery.refetch() });
  const rejectMutation = trpc.admin.rejectUser.useMutation({ onSuccess: () => pendingQuery.refetch() });
  const isApprovePending = approveMutation.status === "pending";
  const isRejectPending = rejectMutation.status === "pending";

  useEffect(() => {
    pendingQuery.refetch();
    allUsersQuery.refetch();
  }, []);

  return (
    <main className="p-8 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Admin Control Panel</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Review and approve new user requests, and monitor platform access.
          </p>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Pending User Approvals</h2>
          {pendingQuery.data?.length ? (
            <div className="space-y-4">
              {pendingQuery.data.map((user: any) => (
                <div key={user.id} className="rounded-2xl border p-4 bg-[var(--bg-primary)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{user.name || user.email}</p>
                      <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => approveMutation.mutate({ email: user.email })}
                        disabled={isApprovePending}
                      >
                        {isApprovePending ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate({ email: user.email })}
                        disabled={isRejectPending}
                      >
                        {isRejectPending ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No pending users at this time.</p>
          )}
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">All Registered Users</h2>
          <div className="space-y-3">
            {allUsersQuery.data?.map((user: any) => (
              <div key={user.id} className="rounded-2xl border p-4 bg-[var(--bg-primary)]">
                <p className="font-semibold">{user.name || user.email}</p>
                <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Role: {user.role} · Approved: {user.approved ? "Yes" : "No"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
