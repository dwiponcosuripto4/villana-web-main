// phone-validator.test.ts
import { describe, it, expect } from "vitest";
import { validatePhone } from "./phoneNumberValidator";

describe("validatePhone", () => {
  it("validates a strict E.164 number", () => {
    const r = validatePhone("+14155552671");
    expect(r.isValid).toBe(true);
    expect(r.kind).toBe("valid-e164");
    expect(r.countryCode).toBe("1");
    expect(r.nsn).toBe("4155552671");
  });

  it("repairs a plain US number", () => {
    const r = validatePhone("415-555-2671");
    expect(r.isValid).toBe(true);
    expect(r.e164).toBe("+14155552671");
  });

  it("rejects clearly invalid shapes", () => {
    const r = validatePhone("12345");
    expect(r.isValid).toBe(false);
    expect(r.kind).toBe("invalid");
  });

  it("detects and normalizes extensions", () => {
    const r = validatePhone("+44 20 7946 0958 ext. 123");
    expect(r.isValid).toBe(true);
    expect(r.extension).toBe("123");
  });

  it("marks missing '+' as potential", () => {
    const r = validatePhone("442079460958");
    expect(r.kind).toBe("potential");
    expect(r.isValid).toBe(false);
  });

  it("rejects empty or whitespace input", () => {
    const r = validatePhone("   ");
    expect(r.isValid).toBe(false);
    expect(r.reason).toBe("empty");
  });

  it("handles Unicode digits", () => {
    const r = validatePhone("＋١٤١٥٥٥٥٢٦٧١"); // fullwidth + Arabic-Indic digits
    expect(r.isValid).toBe(true);
    expect(r.e164).toBe("+14155552671");
  });

  it("flags NANP test block 555-0101 as invalid", () => {
    const r = validatePhone("555-0101");
    expect(r.isValid).toBe(false);
  });

  it("accepts NANP 11-digit with leading 1", () => {
    const r = validatePhone("14155552671");
    expect(r.isValid).toBe(true);
    expect(r.e164).toBe("+14155552671");
  });
});
