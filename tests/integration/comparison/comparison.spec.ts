import { test, expect } from "@playwright/test";

import {
  ComparisonResult,
  CreateComparisonRequest,
} from "@/features/comparison/schemas";

test.describe("Comparison route tests", () => {
  test("Comparing 4 models should return an array with 4 results", async ({
    request,
  }) => {
    const body: CreateComparisonRequest = {
      prompt: "How many letter a`s are present in banana in one sentence",
      category: "generic",
    };

    const req = await request.post("/api/v1/comparisons", {
      data: body,
    });

    const result: ComparisonResult = await req.json();
    const responses = result.responses;

    expect(responses.length).toBe(4);

    for (let item of responses) {
      if (item.status === "ok") {
        expect(item.inputTokens).toBe(body.prompt.length);
      }
    }
  });
});
