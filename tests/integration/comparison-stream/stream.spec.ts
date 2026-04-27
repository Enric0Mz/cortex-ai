import { test, expect } from "../helpers/fixtures";
import { registerFakeModels } from "../helpers/seed-models";

type SseEvent = { event: string; data: Record<string, unknown> };

function parseSseBody(body: string): SseEvent[] {
  const events: SseEvent[] = [];
  for (const frame of body.split("\n\n")) {
    if (!frame.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) continue;
    events.push({ event, data: JSON.parse(dataLines.join("")) });
  }
  return events;
}

function aiModel(evt: SseEvent): { name: string; provider: string } {
  return evt.data.aiModel as { name: string; provider: string };
}

test.describe("POST /api/v1/comparisons/stream", () => {
  let modelIds: string[] = [];
  let seeded: Array<{ id: string; name: string; provider: string }> = [];
  let paidModelId: string;

  test.beforeAll(async ({ request }) => {
    seeded = await registerFakeModels(request);
    modelIds = seeded.map((m) => m.id);
    expect(modelIds.length).toBe(4);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const paidReq = await request.post("/api/v1/models", {
      headers: { "x-admin-token": process.env.ADMIN_API_TOKEN ?? "" },
      data: {
        models: [
          {
            name: `openai/gpt-4o-${suffix}`,
            provider: "openrouter",
            company: "openai",
            isFree: false,
          },
        ],
      },
    });
    expect(paidReq.status()).toBe(201);
    paidModelId = ((await paidReq.json()) as Array<{ id: string }>)[0].id;
  });

  test("streams one completed event per picked model and ends with done", async ({
    ctx,
  }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: { prompt: "hello", models: modelIds },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/event-stream");

    const events = parseSseBody(await res.text());

    expect(events[0].event).toBe("comparison.created");
    expect(typeof events[0].data.comparisonId).toBe("string");

    const completed = events.filter((e) => e.event === "provider.completed");
    expect(completed).toHaveLength(4);

    const completedNames = completed.map((e) => aiModel(e).name).sort();
    expect(completedNames).toEqual(seeded.map((m) => m.name).sort());

    for (const evt of completed) {
      const response = evt.data.response as {
        id: string;
        status: string;
        content: string;
      };
      expect(response.status).toBe("ok");
      expect(typeof response.id).toBe("string");
      expect(response.content).toContain("[fake:");
    }

    expect(events[events.length - 1].event).toBe("done");
    expect(events[events.length - 1].data.comparisonId).toBe(
      events[0].data.comparisonId,
    );
  });

  test("rejects unknown model id with JSON 400 (not SSE)", async ({ ctx }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: {
        prompt: "hi",
        models: [modelIds[0], "11111111-1111-4111-8111-111111111111"],
      },
    });
    expect(res.status()).toBe(400);
    expect(res.headers()["content-type"]).toContain("application/json");
  });

  test("rejects fewer than 2 models with JSON 400", async ({ ctx }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: { prompt: "hi", models: [modelIds[0]] },
    });
    expect(res.status()).toBe(400);
  });

  test("allows anonymous requests for free models", async ({ anon }) => {
    const res = await anon.post("/api/v1/comparisons/stream", {
      data: { prompt: "hi", models: modelIds },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/event-stream");
    const events = parseSseBody(await res.text());
    expect(events[events.length - 1].event).toBe("done");
  });

  test("rejects anonymous paid models with JSON 400", async ({ anon }) => {
    const res = await anon.post("/api/v1/comparisons/stream", {
      data: { prompt: "hi", models: [modelIds[0], paidModelId] },
    });
    expect(res.status()).toBe(400);
    expect(res.headers()["content-type"]).toContain("application/json");
    await expect(res.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  test("allows authenticated paid models", async ({ ctx }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: { prompt: "hi", models: [modelIds[0], paidModelId] },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/event-stream");
  });

  test("rejects non-POST methods", async ({ ctx }) => {
    const res = await ctx.get("/api/v1/comparisons/stream");
    expect(res.status()).toBe(405);
  });

  test("emits provider.failed when one model fails, others still complete", async ({
    ctx,
  }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: { prompt: "run with __fail:groq please", models: modelIds },
    });
    expect(res.status()).toBe(200);

    const events = parseSseBody(await res.text());
    const failed = events.filter((e) => e.event === "provider.failed");
    const completed = events.filter((e) => e.event === "provider.completed");

    expect(failed).toHaveLength(1);
    expect(aiModel(failed[0]).provider).toBe("groq");
    expect(completed).toHaveLength(3);
    expect(events[events.length - 1].event).toBe("done");
  });

  test("__streamfail yields deltas before failing; no persisted row for failed provider", async ({
    ctx,
  }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: { prompt: "run with __streamfail:groq", models: modelIds },
    });
    expect(res.status()).toBe(200);

    const events = parseSseBody(await res.text());
    const groqDeltas = events.filter(
      (e) => e.event === "provider.delta" && aiModel(e).provider === "groq",
    );
    const groqFailed = events.filter(
      (e) => e.event === "provider.failed" && aiModel(e).provider === "groq",
    );
    const groqCompleted = events.filter(
      (e) => e.event === "provider.completed" && aiModel(e).provider === "groq",
    );

    expect(groqDeltas.length).toBeGreaterThanOrEqual(1);
    expect(groqFailed).toHaveLength(1);
    expect(groqCompleted).toHaveLength(0);
  });

  test("__chunks:n splits content into exactly n deltas per adapter", async ({
    ctx,
  }) => {
    const res = await ctx.post("/api/v1/comparisons/stream", {
      data: {
        prompt: "counting with __chunks:5",
        models: [modelIds[0], modelIds[1]],
      },
    });
    expect(res.status()).toBe(200);

    const events = parseSseBody(await res.text());

    const perProvider = new Map<string, string[]>();
    for (const evt of events) {
      if (evt.event !== "provider.delta") continue;
      const key = `${aiModel(evt).provider}|${aiModel(evt).name}`;
      const arr = perProvider.get(key) ?? [];
      arr.push(evt.data.text as string);
      perProvider.set(key, arr);
    }

    expect(perProvider.size).toBe(2);
    for (const [, deltas] of perProvider) {
      expect(deltas).toHaveLength(5);
    }

    for (const [key, deltas] of perProvider) {
      const combined = deltas.join("");
      const completed = events.find(
        (e) =>
          e.event === "provider.completed" &&
          `${aiModel(e).provider}|${aiModel(e).name}` === key,
      );
      expect(completed).toBeTruthy();
      const response = completed!.data.response as { content: string };
      expect(response.content).toBe(combined);
    }
  });
});
