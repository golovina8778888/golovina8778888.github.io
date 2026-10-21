import assert from "node:assert/strict";
import { test } from "node:test";
import { isFormEndpoint, sendInquiry } from "../src/contact.js";

const inquiry = {
  name: "  Test sender ", company: " Studio ",
  email: " person@example.com ", message: "  A brief catalog inquiry.  ", honey: "",
};
const endpoint = "https://formspree.io/f/abc123";

test("sends only the inquiry fields and accepts an explicit acknowledgement", async () => {
  let request;
  await sendInquiry(inquiry, "Catalog inquiry", new AbortController().signal, async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ next: "/thanks" }) };
  }, endpoint);
  assert.equal(request.url, endpoint);
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.referrerPolicy, "origin");
  assert.equal(request.options.redirect, "error");
  assert.deepEqual(JSON.parse(request.options.body), {
    name: "Test sender", company: "Studio", email: "person@example.com",
    message: "A brief catalog inquiry.", _subject: "Catalog inquiry", _gotcha: "",
  });
});

test("HTTP success without provider acknowledgement does not claim delivery", async () => {
  await assert.rejects(sendInquiry(inquiry, "", undefined, async () => ({
    ok: true, json: async () => ({}),
  }), endpoint));
});

test("a rejected request does not claim delivery", async () => {
  await assert.rejects(sendInquiry(inquiry, "", undefined, async () => ({
    ok: false, json: async () => ({ next: "/thanks" }),
  }), endpoint));
});

test("unconfigured or malformed endpoints never reach the network", async () => {
  assert.equal(isFormEndpoint("https://formspree.io/f/abc123"), true);
  assert.equal(isFormEndpoint("https://formspree.io/adm@pliply.pro"), false);
  let requests = 0;
  await assert.rejects(sendInquiry(inquiry, "", undefined, async () => { requests++; }, ""));
  assert.equal(requests, 0);
});
