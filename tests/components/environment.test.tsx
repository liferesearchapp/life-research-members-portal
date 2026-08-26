import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/** Smoke test for the jsdom project itself: JSX compiles, a document exists, matchers load. */
describe("component test environment", () => {
  it("renders JSX into a real document", () => {
    render(<p>hello from jsdom</p>);
    expect(screen.getByText("hello from jsdom")).toBeInTheDocument();
  });
});
