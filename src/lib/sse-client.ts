// Browser-side SSE frame parser. Reads a ReadableStream<Uint8Array> and
// yields one {event, data} per server frame. Handles the two framing
// hazards: frames can span chunks, and one chunk can contain multiple frames.
// Lines with unrecognized or missing prefixes are ignored (per the SSE spec).
export type SseFrame = { event: string; data: unknown };

export async function* parseSSEStream(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<SseFrame> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseFrame(frame);
        if (parsed) yield parsed;
        boundary = buffer.indexOf("\n\n");
      }
    }
    const tail = buffer.trim();
    if (tail) {
      const parsed = parseFrame(tail);
      if (parsed) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(frame: string): SseFrame | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const raw of frame.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("")) };
  } catch {
    return null;
  }
}
