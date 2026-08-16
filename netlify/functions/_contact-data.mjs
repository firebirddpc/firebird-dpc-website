import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

export const contactStore = () => getStore("firebird-contact-submissions");

export const json = (statusCode, value, headers = {}) => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8", ...headers },
  body: JSON.stringify(value),
});

const clean = (v) => String(v ?? "").trim();

export function normalizeSubmission(input) {
  const fullName = clean(input.fullName);
  const email = clean(input.email);
  const mainQuestion = clean(input.mainQuestion);
  if (!fullName || !email || !mainQuestion) {
    throw new Error("Name, email, and your question are required.");
  }
  if (clean(input.botField)) {
    // Honeypot field — a real visitor never fills this in.
    throw new Error("Submission rejected.");
  }
  return {
    id: randomUUID(),
    fullName,
    email,
    phone: clean(input.phone),
    preferredContact: clean(input.preferredContact),
    membershipInterest: clean(input.membershipInterest),
    mainQuestion,
    bestTime: clean(input.bestTime),
    consent: clean(input.consent),
    submittedAt: new Date().toISOString(),
    read: false,
  };
}

export async function listSubmissions() {
  const store = contactStore();
  const { blobs = [] } = await store.list();
  const out = [];
  for (const b of blobs) {
    const item = await store.get(b.key, { type: "json" });
    if (item) out.push(item);
  }
  return out.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}
