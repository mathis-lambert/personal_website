import "server-only";
import { randomUUID } from "node:crypto";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

import { getAiEnv } from "@/lib/ai/env";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { buildSelfTools } from "@/lib/ai/tools/selfTools";
import { extractTextFromResult, getText } from "@/lib/ai/aiText";
import type {
  AgentMessage,
  AgentResponse,
  AgentStreamEvent,
} from "@/types/agent";

const tools = buildSelfTools();

const createModel = (streaming: boolean) => {
  const env = getAiEnv();
  return new ChatOpenAI({
    model: env.model,
    temperature: 0.2,
    apiKey: env.apiKey,
    configuration: {
      baseURL: env.baseUrl,
      defaultHeaders: {
        "X-ML-API-Key": env.apiKey,
      },
    },
    useResponsesApi: true,
    streaming,
    streamUsage: true,
  });
};

const model = createModel(false);
const streamingModel = createModel(true);

export type AgentRunOptions = {
  messages: AgentMessage[];
  location?: string;
};

export const runAgent = async (
  options: AgentRunOptions,
): Promise<AgentResponse> => {
  const env = getAiEnv();
  const systemPrompt = buildSystemPrompt(options.location);
  const agent = createAgent({
    model,
    tools,
    systemPrompt,
  });

  const result = await agent.invoke({
    messages: options.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });

  const text = extractTextFromResult(result);

  return {
    id: randomUUID(),
    model: env.model,
    message: {
      role: "assistant",
      content: text || "I haven't shared that yet.",
    },
  };
};

export const streamAgent = async function* (
  options: AgentRunOptions,
): AsyncGenerator<AgentStreamEvent> {
  const env = getAiEnv();
  const systemPrompt = buildSystemPrompt(options.location);
  const agent = createAgent({
    model: streamingModel,
    tools,
    systemPrompt,
  });

  const stream = agent.streamEvents(
    {
      messages: options.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
    { version: "v2" },
  );

  let content = "";

  for await (const event of stream) {
    if (
      event.event === "on_chat_model_stream" ||
      event.event === "on_llm_stream"
    ) {
      const chunk = event.data?.chunk;
      const delta = getText(chunk);
      if (delta) {
        content += delta;
        yield { type: "delta", delta };
      }
    }

    if (event.event === "on_chat_model_end" || event.event === "on_llm_end") {
      const output = event.data?.output;
      if (!content && output) {
        const delta = getText(output);
        if (delta) {
          content = delta;
          yield { type: "delta", delta };
        }
      }
    }
  }

  yield {
    type: "final",
    response: {
      id: randomUUID(),
      model: env.model,
      message: {
        role: "assistant",
        content: content || "I haven't shared that yet.",
      },
    },
  };
};
