import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import {
  STATIC_GUIDE,
  dynamicContext,
  type AssistantCatalog,
  type AssistantClientCtx,
} from '@/lib/assistant/knowledge';

// The Anthropic SDK needs the Node runtime (not edge).
export const runtime = 'nodejs';

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  // Only signed-in clients can use the assistant.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("The assistant isn't set up yet — ANTHROPIC_API_KEY is missing.", { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const rawMessages: unknown = body?.messages;
  const catalog = (body?.catalog ?? {}) as AssistantCatalog;
  const ctx = (body?.client ?? {}) as AssistantClientCtx;

  // Sanitise the transcript: keep the last 12 user/assistant turns, cap length.
  const messages: ChatMsg[] = (Array.isArray(rawMessages) ? rawMessages : [])
    .filter((m): m is ChatMsg =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0,
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response('Bad request', { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let anthropicStream;
  try {
    anthropicStream = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        // Stable prefix — cached so repeat questions are fast and cheap.
        { type: 'text', text: STATIC_GUIDE, cache_control: { type: 'ephemeral' } },
        // Volatile per-client context — after the cache breakpoint.
        { type: 'text', text: dynamicContext(catalog, ctx) },
      ],
      messages,
      stream: true,
    });
  } catch {
    return new Response('Sorry — I could not reach the assistant. Please try again.', { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode('\n\n_Sorry — I hit a snag. Try again in a moment._'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
