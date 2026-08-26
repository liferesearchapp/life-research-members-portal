import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  getAccountFromRequest: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: { account: { update: mocks.update } },
}));

vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));

import handler from "../../src/pages/api/active-account/update-last-login";

function request(method = "POST") {
  return {
    headers: { authorization: "Bearer test" },
    method,
  } as unknown as NextApiRequest;
}

function response() {
  const res = { send: vi.fn(), setHeader: vi.fn(), status: vi.fn() };
  res.send.mockReturnValue(res);
  res.status.mockReturnValue(res);
  return res as unknown as NextApiResponse;
}

describe("update-last-login API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stamps last_login on POST", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ id: 7 });
    mocks.update.mockResolvedValue({ id: 7 });
    const res = response();

    await handler(request("POST"), res);

    expect(mocks.update).toHaveBeenCalledTimes(1);
    const arg = mocks.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 7 });
    expect(arg.data.last_login).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("refuses GET, because a write does not belong on a verb treated as safe", async () => {
    // The regression this guards: browsers, proxies, and retry logic are entitled to issue a GET
    // speculatively. When they did, this route restamped last_login -- the only signal the admin
    // Adoption report has.
    const res = response();

    await handler(request("GET"), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.getAccountFromRequest).not.toHaveBeenCalled();
  });

  it("writes nothing when the caller is not authenticated", async () => {
    // getAccountFromRequest has already sent its own 401 in this case.
    mocks.getAccountFromRequest.mockResolvedValue(null);
    const res = response();

    await handler(request("POST"), res);

    expect(mocks.update).not.toHaveBeenCalled();
  });
});
