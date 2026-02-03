export type AgentRole = "system" | "user" | "assistant" | "tool";

export interface AgentMessage {
  role: AgentRole;
  content: string;
  name?: string;
}

export interface AgentRequest {
  messages: AgentMessage[];
  location?: string;
  stream?: boolean;
}

export interface AgentUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface AgentResponse {
  id: string;
  message: AgentMessage;
  model?: string;
  usage?: AgentUsage;
}

export type AgentStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "tool_call"; name: string; input: unknown }
  | { type: "tool_result"; name: string; output: unknown }
  | { type: "final"; response: AgentResponse }
  | { type: "error"; error: string };
