import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";
import { execFile } from "node:child_process";

function execCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
    const args = process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-lc", command];

    const child = execFile(shell, args, { timeout: 60_000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve({ stdout: stdout?.trim() ?? "", stderr: stderr?.trim() ?? "" });
    });

    child.on("error", (err) => reject({ error: err, stdout: "", stderr: String(err) }));
  });
}

export const toolsRouter = createRouter({
  execScript: authedQuery
    .input(
      z.object({
        script: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.allowScriptExecution) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Script execution is disabled. Set ALLOW_SCRIPT_EXECUTION=1 to enable it in your secure lab environment.",
        });
      }

      try {
        const { stdout, stderr } = await execCommand(input.script);
        return {
          command: input.script,
          stdout,
          stderr,
        };
      } catch (result) {
        const error = result as { error?: unknown; stdout: string; stderr: string };
        return {
          command: input.script,
          stdout: error.stdout,
          stderr: error.stderr + (error.error ? `\n${String(error.error)}` : ""),
        };
      }
    }),
});
