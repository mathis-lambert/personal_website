type ChatConversationStatus = "active" | "errored";
type ChatTurnStatus = "pending" | "completed" | "failed";

interface ChatConversationListItem {
  conversationId: string;
  sessionId?: string;
  location?: string;
  actorType: "public";
  startedAt: string;
  lastMessageAt: string;
  turnCount: number;
  successfulTurns: number;
  failedTurns: number;
  status: ChatConversationStatus;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}

export interface ChatConversationDetail extends ChatConversationListItem {
  lastError?: string;
}

export interface ChatConversationTurnItem {
  turnId: string;
  conversationId: string;
  turnIndex: number;
  status: ChatTurnStatus;
  streamed: boolean;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  route: string;
  path: string;
  location?: string;
  requestMessages: Array<{ role: string; content: string; name?: string }>;
  lastUserMessage?: string;
  assistantMessage?: string;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  errorMessage?: string;
}

export interface AdminConversationsListResponse {
  ok: boolean;
  total: number;
  items: ChatConversationListItem[];
}

export interface AdminConversationDetailResponse {
  ok: boolean;
  item: ChatConversationDetail | null;
}

export interface AdminConversationTurnsResponse {
  ok: boolean;
  total: number;
  items: ChatConversationTurnItem[];
}
