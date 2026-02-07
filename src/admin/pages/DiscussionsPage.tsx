"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import {
  deleteConversation,
  getConversationDetail,
  getConversations,
  getConversationTurns,
} from "@/api/admin";
import type {
  AdminConversationDetailResponse,
  AdminConversationsListResponse,
  AdminConversationTurnsResponse,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatUtc = (value?: string): string => {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toISOString().replace("T", " ").slice(0, 19);
};

type Preset = "24h" | "7d" | "30d" | "custom";

const DiscussionsPage: React.FC = () => {
  const { token } = useAdminAuth();

  const [preset, setPreset] = useState<Preset>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [query, setQuery] = useState("");
  const [actorType, setActorType] = useState<"" | "public" | "admin">("");
  const [status, setStatus] = useState<"" | "active" | "errored">("");

  const [listData, setListData] =
    useState<AdminConversationsListResponse | null>(null);
  const [detailData, setDetailData] =
    useState<AdminConversationDetailResponse | null>(null);
  const [turnsData, setTurnsData] =
    useState<AdminConversationTurnsResponse | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  );

  const [loadingList, setLoadingList] = useState(false);
  const [loadingTurns, setLoadingTurns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { startIso, endIso } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now.getTime() - 7 * 86400000);

    if (preset === "24h") {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (preset === "30d") {
      start = new Date(now.getTime() - 30 * 86400000);
    } else if (preset === "custom") {
      if (customStart) start = new Date(`${customStart}T00:00:00.000Z`);
      if (customEnd) end.setTime(new Date(`${customEnd}T23:59:59.999Z`).getTime());
    }

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    let canceled = false;
    if (!token) return;

    const load = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const data = await getConversations(
          {
            start: startIso,
            end: endIso,
            actorType: actorType || undefined,
            status: status || undefined,
            q: query || undefined,
            limit: 100,
            skip: 0,
          },
          token,
        );

        if (canceled) return;

        setListData(data);

        setSelectedConversationId((prev) => {
          if (prev && data.items.some((item) => item.conversationId === prev)) {
            return prev;
          }
          return data.items[0]?.conversationId ?? null;
        });
      } catch (loadError) {
        if (!canceled) {
          setError((loadError as Error).message || "Failed to load discussions");
        }
      } finally {
        if (!canceled) {
          setLoadingList(false);
        }
      }
    };

    void load();

    return () => {
      canceled = true;
    };
  }, [token, startIso, endIso, actorType, status, query, refreshKey]);

  useEffect(() => {
    let canceled = false;
    if (!token || !selectedConversationId) {
      setDetailData(null);
      setTurnsData(null);
      return;
    }

    const loadTurns = async () => {
      setLoadingTurns(true);
      setError(null);
      try {
        const [detail, turns] = await Promise.all([
          getConversationDetail(selectedConversationId, token),
          getConversationTurns(
            selectedConversationId,
            {
              limit: 250,
              skip: 0,
            },
            token,
          ),
        ]);

        if (canceled) return;

        setDetailData(detail);
        setTurnsData(turns);
      } catch (loadError) {
        if (!canceled) {
          setError(
            (loadError as Error).message ||
              "Failed to load discussion transcript",
          );
        }
      } finally {
        if (!canceled) {
          setLoadingTurns(false);
        }
      }
    };

    void loadTurns();

    return () => {
      canceled = true;
    };
  }, [token, selectedConversationId]);

  const selected = detailData?.item;

  const handleDeleteConversation = async () => {
    if (!selectedConversationId || !token) return;
    const confirmed = window.confirm(
      "Delete this conversation and all turns? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteConversation(selectedConversationId, token);
      setRefreshKey(Date.now());
    } catch (deleteError) {
      setError((deleteError as Error).message || "Failed to delete conversation");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Discussions</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Transcript Filters</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshKey(Date.now())}
          >
            <RefreshCw className="mr-1 size-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["24h", "7d", "30d", "custom"] as Preset[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={preset === value ? "default" : "secondary"}
                onClick={() => setPreset(value)}
              >
                {value === "custom" ? "Custom" : value}
              </Button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[12rem]"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[12rem]"
              />
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Search in prompts and answers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              value={actorType}
              onChange={(e) => setActorType(e.target.value as "" | "public" | "admin")}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All actors</option>
              <option value="public">Public</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | "active" | "errored")}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="errored">Errored</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-[70vh] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              Conversations ({listData?.total ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(70vh-80px)] overflow-auto p-0">
            {loadingList ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>
            ) : listData?.items.length ? (
              <ul className="divide-y">
                {listData.items.map((item) => (
                  <li key={item.conversationId}>
                    <button
                      onClick={() => setSelectedConversationId(item.conversationId)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedConversationId === item.conversationId
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {item.actorType} · {item.status}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatUtc(item.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium">
                        {item.lastUserMessage || "(no user message)"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.lastAssistantMessage || "(no assistant message)"}
                      </p>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {item.turnCount} turns · {item.successfulTurns} success · {item.failedTurns} failed
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No discussions in current filters.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-[70vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Transcript</CardTitle>
            <Button
              size="sm"
              variant="destructive"
              disabled={!selectedConversationId}
              onClick={() => void handleDeleteConversation()}
            >
              <Trash2 className="mr-1 size-4" /> Delete
            </Button>
          </CardHeader>
          <CardContent className="h-[calc(70vh-80px)] overflow-auto space-y-4">
            {!selectedConversationId ? (
              <div className="text-sm text-muted-foreground">
                Select a conversation to inspect the full thread.
              </div>
            ) : loadingTurns ? (
              <div className="text-sm text-muted-foreground">Loading transcript…</div>
            ) : (
              <>
                {selected && (
                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>ID: {selected.conversationId}</span>
                      <span>Status: {selected.status}</span>
                      <span>Session: {selected.sessionId || "n/a"}</span>
                      <span>Location: {selected.location || "n/a"}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Started {formatUtc(selected.startedAt)} · Last {formatUtc(selected.lastMessageAt)}
                    </div>
                    {selected.lastError && (
                      <div className="mt-2 text-xs text-red-600">Last error: {selected.lastError}</div>
                    )}
                  </div>
                )}

                {turnsData?.items.length ? (
                  <div className="space-y-3">
                    {turnsData.items.map((turn) => (
                      <article
                        key={turn.turnId}
                        className="rounded-xl border p-3 bg-card/70 backdrop-blur"
                      >
                        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Turn #{turn.turnIndex} · {turn.status} · {turn.streamed ? "stream" : "sync"}
                          </span>
                          <span>{formatUtc(turn.createdAt)}</span>
                        </header>

                        <div className="mt-3 space-y-3">
                          <section>
                            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              User Input
                            </h3>
                            <pre className="rounded-md border bg-muted/30 p-2 text-xs whitespace-pre-wrap break-words font-mono">
                              {turn.lastUserMessage || "(empty)"}
                            </pre>
                          </section>

                          <section>
                            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Assistant Output
                            </h3>
                            <pre className="rounded-md border bg-cyan-500/5 p-2 text-xs whitespace-pre-wrap break-words font-mono">
                              {turn.assistantMessage || "(no output)"}
                            </pre>
                          </section>
                        </div>

                        <footer className="mt-2 text-[11px] text-muted-foreground">
                          {turn.model || "unknown model"}
                          {typeof turn.durationMs === "number"
                            ? ` · ${turn.durationMs} ms`
                            : ""}
                          {turn.errorMessage ? ` · ${turn.errorMessage}` : ""}
                        </footer>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No turns found for this conversation.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiscussionsPage;
