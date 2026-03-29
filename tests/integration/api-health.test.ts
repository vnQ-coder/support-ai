import { describe, it, expect } from "vitest";
import { GET } from "../../apps/api/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("supportai-api");
    expect(body.timestamp).toBeDefined();
  });

  it("returns valid ISO timestamp", async () => {
    const response = await GET();
    const body = await response.json();
    const date = new Date(body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });
});
