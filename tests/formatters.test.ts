import { test } from "node:test";
import assert from "node:assert";
import { formatDuration, formatLargeNumber, formatSignificantNumber } from "../src/core/formatters.ts";

test("formatLargeNumber - small values", () => {
  assert.strictEqual(formatLargeNumber(0), "0");
  assert.strictEqual(formatLargeNumber(5), "5");
  assert.strictEqual(formatLargeNumber(12.34), "12.3");
  assert.strictEqual(formatLargeNumber(999), "999");
  assert.strictEqual(formatLargeNumber(999.5), "1K");
});

test("formatLargeNumber - K values", () => {
  assert.strictEqual(formatLargeNumber(1000), "1K");
  assert.strictEqual(formatLargeNumber(1200), "1.2K");
  assert.strictEqual(formatLargeNumber(1234), "1.23K");
  assert.strictEqual(formatLargeNumber(15000), "15K");
  assert.strictEqual(formatLargeNumber(999999), "1M");
});

test("formatLargeNumber - M values", () => {
  assert.strictEqual(formatLargeNumber(1000000), "1M");
  assert.strictEqual(formatLargeNumber(1234567), "1.23M");
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

test("formatDuration - shows hours minutes and seconds", () => {
  assert.strictEqual(formatDuration(0), "00h 00m 00s");
  assert.strictEqual(formatDuration(59), "00h 00m 59s");
  assert.strictEqual(formatDuration(60), "00h 01m 00s");
  assert.strictEqual(formatDuration(3661), "01h 01m 01s");
  assert.strictEqual(formatDuration(7325.1), "02h 02m 06s");
});

test("formatSignificantNumber - rounds to three significant digits", () => {
  assert.strictEqual(formatSignificantNumber(1.2345), "1.23");
  assert.strictEqual(formatSignificantNumber(12.345), "12.3");
  assert.strictEqual(formatSignificantNumber(123.45), "123");
  assert.strictEqual(formatSignificantNumber(0.012345), "0.0123");
});
