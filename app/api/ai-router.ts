import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { askOllama, type ChatMessage } from "./ai";

export const aiRouter = createRouter({
  chat: authedQuery
    .input(
      z.object({
        prompt: z.string().min(1),
        history: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            }),
          )
          .optional(),
        model: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const system: ChatMessage = {
        role: "system",
        content:
          "You are Sentinel, a cybersecurity lab assistant. Provide precise security commands, exploit payload examples, defensive recommendations, and exact shell commands when asked. If a user asks for code or a fix, always include the exact command or code snippet used.",
      };
      const messages: ChatMessage[] = [
        system,
        ...((input.history ?? []) as ChatMessage[]),
        { role: "user", content: input.prompt },
      ];
      const response = await askOllama(messages, input.model);
      return { response };
    }),
});
