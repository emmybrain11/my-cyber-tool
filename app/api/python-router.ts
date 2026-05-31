import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";

const pythonServiceBaseUrl = env.pythonServiceUrl;

function normalizeServiceUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new Error("PYTHON_SERVICE_URL is not configured.");
  }
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `http://${trimmed.replace(/\/$/, "")}`;
}

async function fetchPythonService(path: string, method = "GET", body?: unknown) {
  const baseUrl = normalizeServiceUrl(pythonServiceBaseUrl);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  let payload: unknown;

  if (contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  } else {
    payload = text;
  }

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Python service error ${response.status}: ${text}`,
    });
  }

  return payload;
}

export const pythonRouter = createRouter({
  tools: authedQuery.query(async () => {
    return await fetchPythonService("/tools");
  }),

  cloneRepo: authedQuery
    .input(
      z.object({
        repoUrl: z.string().url(),
        branch: z.string().optional(),
        targetDir: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await fetchPythonService("/clone", "POST", {
        repo_url: input.repoUrl,
        branch: input.branch,
        target_dir: input.targetDir,
      });
    }),

  runTool: authedQuery
    .input(
      z.object({
        toolName: z.string().min(1),
        args: z.string().optional(),
        repoPath: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await fetchPythonService("/run", "POST", {
        tool: input.toolName,
        args: input.args ?? "",
        repo_path: input.repoPath,
      });
    }),

  runCustomCommand: authedQuery
    .input(
      z.object({
        command: z.string().min(1),
        repoPath: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await fetchPythonService("/run", "POST", {
        command: input.command,
        repo_path: input.repoPath,
      });
    }),
});
