import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";
import methodAllowed from "../../src/utils/api/method-allowed";

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string | string[]>,
    setHeader: vi.fn((k: string, v: string | string[]) => {
      res.headers[k] = v;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    send: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res as unknown as NextApiResponse & typeof res;
}

const req = (method?: string) => ({ method } as NextApiRequest);

describe("methodAllowed", () => {
  it("lets a declared method through without touching the response", () => {
    const res = mockRes();

    expect(methodAllowed(req("GET"), res, ["GET"])).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("accepts any of several declared methods", () => {
    const res = mockRes();

    expect(methodAllowed(req("POST"), res, ["GET", "POST"])).toBe(true);
    expect(methodAllowed(req("GET"), res, ["GET", "POST"])).toBe(true);
  });

  it("refuses an undeclared method with 405 and an Allow header", () => {
    const res = mockRes();

    expect(methodAllowed(req("GET"), res, ["DELETE"])).toBe(false);
    expect(res.statusCode).toBe(405);
    expect(res.headers["Allow"]).toBe("DELETE");
  });

  it("lists every allowed method in the Allow header", () => {
    const res = mockRes();

    methodAllowed(req("PUT"), res, ["GET", "POST"]);

    expect(res.headers["Allow"]).toBe("GET, POST");
  });

  it("names the rejected method in the message, so a caller can see what it sent", () => {
    const res = mockRes();

    methodAllowed(req("DELETE"), res, ["GET"]);

    expect(String(res.body)).toContain("DELETE");
  });

  it("normalises a lowercase method rather than rejecting it", () => {
    const res = mockRes();

    expect(methodAllowed(req("patch"), res, ["PATCH"])).toBe(true);
  });

  it("treats a missing method as GET, matching how Next reports one", () => {
    expect(methodAllowed(req(undefined), mockRes(), ["GET"])).toBe(true);
    expect(methodAllowed(req(undefined), mockRes(), ["POST"])).toBe(false);
  });

  it("accepts HEAD wherever GET is allowed, and not otherwise", () => {
    // HEAD is GET without a body, and Next runs the same handler for it.
    expect(methodAllowed(req("HEAD"), mockRes(), ["GET"])).toBe(true);
    expect(methodAllowed(req("HEAD"), mockRes(), ["POST"])).toBe(false);
  });
});
