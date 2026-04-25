import { test } from "node:test";
import assert from "node:assert";
import { formatLargeNumber } from "../src/core/formatters.ts";

test("formatLargeNumber - small values", () => {
  assert.strictEqual(formatLargeNumber(0), "0");
  assert.strictEqual(formatLargeNumber(5), "5");
  assert.strictEqual(formatLargeNumber(999), "999");
});

test("formatLargeNumber - K values", () => {
  assert.strictEqual(formatLargeNumber(1000), "1K");
  assert.strictEqual(formatLargeNumber(1200), "1.2K");
  assert.strictEqual(formatLargeNumber(15000), "15K");
  assert.strictEqual(formatLargeNumber(999999), "1M");
});

test("formatLargeNumber - M values", () => {
  assert.strictEqual(formatLargeNumber(1000000), "1M");
  assert.strictEqual(formatLargeNumber(1500000), "1.5M");
});

test("formatLargeNumber - B values", () => {
  assert.strictEqual(formatLargeNumber(1000000000), "1B");
  assert.strictEqual(formatLargeNumber(2300000000), "2.3B");
});

test("formatLargeNumber - aa values", () => {
  assert.strictEqual(formatLargeNumber(1000000000000), "1aa");
  assert.strictEqual(formatLargeNumber(3800000000000), "3.8aa");
});

test("formatLargeNumber - ab values", () => {
  assert.strictEqual(formatLargeNumber(1000000000000000), "1ab");
  assert.strictEqual(formatLargeNumber(9400000000000000), "9.4ab");
});

test("formatLargeNumber - deep alphabet values", () => {
  // exponent 4 -> aa (10^12)
  // exponent 30 -> ba (10^90)
  assert.strictEqual(formatLargeNumber(Math.pow(10, 90)), "1ba");
});
