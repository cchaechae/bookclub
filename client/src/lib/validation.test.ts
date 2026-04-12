import { describe, expect, it } from "vitest";
import { parseCadence, validateCadence, validateRequired } from "./validation";

describe("validateRequired", () => {
  it("rejects empty", () => {
    expect(validateRequired("", "Genre")).toMatch(/required/i);
  });
  it("accepts non-empty", () => {
    expect(validateRequired("historical", "Genre")).toBeNull();
  });
});

describe("validateCadence", () => {
  it("rejects empty", () => {
    expect(validateCadence("")).not.toBeNull();
  });
  it("rejects zero", () => {
    expect(validateCadence("0")).not.toBeNull();
  });
  it("accepts two decimals", () => {
    expect(validateCadence("2.25")).toBeNull();
  });
  it("rejects three decimals", () => {
    expect(validateCadence("1.234")).not.toBeNull();
  });
});

describe("parseCadence", () => {
  it("parses valid", () => {
    expect(parseCadence("2.5")).toBe(2.5);
  });
  it("returns null on invalid", () => {
    expect(parseCadence("bad")).toBeNull();
  });
});
