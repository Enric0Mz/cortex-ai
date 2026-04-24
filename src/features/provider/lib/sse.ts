// Turns an SSE response body into an async iterable of `data:` payloads.
// Handles the two framing hazards: a single `data:` line can span multiple
// chunks, and one chunk can contain multiple frames — a naive per-chunk
// split('\n') loses both.
export async function* parseSSELines(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<string> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx = buffer.indexOf("\n");
      while (newlineIdx !== -1) {
        const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
        buffer = buffer.slice(newlineIdx + 1);
        if (line.startsWith("data:")) {
          yield line.slice(5).trimStart();
        }
        newlineIdx = buffer.indexOf("\n");
      }
    }
    const tail = buffer.replace(/\r$/, "");
    if (tail.startsWith("data:")) yield tail.slice(5).trimStart();
  } finally {
    reader.releaseLock();
  }
}
