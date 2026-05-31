import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";
import { execFile } from "node:child_process";
import type { ExecFileOptionsWithStringEncoding } from "node:child_process";

async function execFileWithInput(
  file: string,
  args: string[],
  options?: ExecFileOptionsWithStringEncoding & { input?: string },
): Promise<{ stdout: string; stderr: string }> {
  const { input, ...execOptions } = options ?? {};

  return new Promise((resolve, reject) => {
    const child = execFile(
      file,
      args,
      { encoding: "utf8", ...execOptions },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
      },
    );

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

export async function askOllama(messages: ChatMessage[], model?: string) {
  const activeModel = model?.trim() || env.ollaModel;
  const requestBody = {
    model: activeModel,
    messages,
    temperature: 0.15,
    max_tokens: 1024,
  };

  if (env.ollaApiUrl) {
    const apiUrl = normalizeApiUrl(env.ollaApiUrl);
    try {
      const response = await fetch(new URL("/v1/chat/completions", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Ollama request failed: ${response.status} ${text}`,
        });
      }

      const payload = (await response.json()) as any;
      const content = payload?.choices?.[0]?.message?.content || payload?.result || payload?.output || "No response received.";
      return String(content);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Ollama HTTP request failed: ${String(error)}`,
      });
    }
  }

  try {
    const inputPayload = JSON.stringify({ model: activeModel, messages });
    const { stdout, stderr } = await execFileWithInput(
      "ollama",
      ["chat", activeModel, "--json"],
      {
        timeout: 60_000,
        maxBuffer: 10 * 1024 * 1024,
        input: inputPayload,
      } as any,
    );

    const stderrText = String(stderr ?? "");
    if (stderrText.trim()) {
      console.warn("Ollama CLI warning:", stderrText.trim());
    }

    const stdoutText = String(stdout ?? "");
    const response = JSON.parse(stdoutText || "{}") as any;
    const content = response?.choices?.[0]?.message?.content || response?.result || response?.output || "No response received.";
    return String(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Ollama CLI request failed: ${message}`,
    });
  }
}
