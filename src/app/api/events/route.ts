import { subscribe } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));
      const unsub = subscribe((event, data) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: event, data })}\n\n`)); }
        catch { unsub(); }
      });
      const hb = setInterval(() => {
        try { controller.enqueue(encoder.encode("data: {\"type\":\"hb\"}\n\n")); }
        catch { clearInterval(hb); unsub(); }
      }, 30000);
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
