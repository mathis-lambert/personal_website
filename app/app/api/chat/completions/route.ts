import { NextResponse, type NextRequest } from "next/server";

import { getAllArticles, getAllProjects } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

const encoder = new TextEncoder();

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    messages?: Array<{ role: string; content: string }>;
    location?: string;
  };

  const history = body.messages ?? [];
  const last = history[history.length - 1];
  const userContent = last?.content ?? "Hello!";
  const location = body.location ?? "unknown";

  const [projects, articles] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
  ]);

  const summary =
    projects.length || articles.length
      ? `I have ${projects.length} projects and ${articles.length} articles you can explore on this site.`
      : "You can browse my work, resume, and blog posts on this site.";

  const responseText = `You said: "${userContent}". ${summary} Let me know if you want a recommendation tailored to ${location}.`;
  await logEvent("chat_completion", { location, messages: history });

  const chunks = [
    responseText.slice(0, Math.max(40, Math.floor(responseText.length / 2))),
    responseText.slice(Math.max(40, Math.floor(responseText.length / 2))),
  ].filter(Boolean);

  const stream = new ReadableStream({
    start(controller) {
      let index = 0;
      const push = () => {
        if (index >= chunks.length) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        const payload = {
          id: "local-chat",
          choices: [
            {
              delta: { content: chunks[index] },
              finish_reason: index === chunks.length - 1 ? "stop" : null,
            },
          ],
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
        index += 1;
        setTimeout(push, 80);
      };
      push();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
