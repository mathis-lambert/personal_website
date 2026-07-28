"use client";

import { Bot, CornerDownLeft, MessageCircle } from "lucide-react";

import { Action, Eyebrow, Page, Reveal, Title } from "@/components/ds";
import { useChat } from "@/hooks/useChat";

const prompts = [
  "What has he shipped with vLLM?",
  "Show me the retrieval work.",
  "Is he available for an internship?",
];

/**
 * The one inverted band on the page, breaking the paper rhythm exactly once.
 * No image: the colour and the type carry it.
 */
export function AskBand() {
  const { openChat, sendMessage } = useChat();

  return (
    <Page as="div" data-ink="coral" className="py-6">
      <Reveal>
        <section
          aria-labelledby="ask-title"
          className="surface-invert relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14"
        >
          {/* A wash of the ink bled in from the trailing corner: colour, but
              part of the surface rather than an object sitting on it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand opacity-25 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Eyebrow className="mb-4 text-brand">
                <Bot className="size-3.5" />
                Ask the work itself
              </Eyebrow>
              <Title level={2} id="ask-title" className="text-ink-invert">
                There&apos;s an assistant here that has read everything.
              </Title>
              <p className="measure mt-4 text-ink-invert/65">
                It knows the projects, the writing and the resume. Ask something
                specific and it answers with the right link rather than a
                summary.
              </p>
              <Action tone="brand" size="lg" onClick={openChat} className="mt-7">
                <MessageCircle /> Start a conversation
              </Action>
            </div>

            {/* Real starters, not decoration: each one opens the chat with
                that question already sent. */}
            <ul className="flex flex-col gap-2.5">
              {prompts.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => {
                      openChat();
                      sendMessage(prompt, "/");
                    }}
                    className="group/prompt flex w-full items-center justify-between gap-3 rounded-4 border border-ink-invert/20 px-4 py-3 text-left text-[0.9375rem] leading-snug text-ink-invert/80 transition-colors duration-200 ease-(--ease-paper) hover:border-brand hover:bg-ink-invert/[0.06] hover:text-ink-invert"
                  >
                    {prompt}
                    <CornerDownLeft className="size-3.5 shrink-0 text-brand opacity-0 transition-opacity duration-200 group-hover/prompt:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>
    </Page>
  );
}
