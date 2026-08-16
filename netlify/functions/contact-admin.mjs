import { connectLambda } from "@netlify/blobs";
import { requireEditor } from "./_blog-auth.mjs";
import { contactStore, json, listSubmissions } from "./_contact-data.mjs";
import { text } from "./_blog-data.mjs";

// Protected endpoint for the /admin/ panel — reuses the exact same Identity
// session check already proven working for the blog editor.
export async function handler(event) {
  connectLambda(event);
  const auth = await requireEditor(event);
  if (auth.response) return auth.response;
  const store = contactStore();

  if (event.httpMethod === "GET") return json(200, await listSubmissions());

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return text(400, "Submission ID is required.");
    await store.delete(id);
    return json(200, { deleted: id });
  }

  if (event.httpMethod === "PATCH") {
    const id = event.queryStringParameters?.id;
    if (!id) return text(400, "Submission ID is required.");
    const existing = await store.get(id, { type: "json" });
    if (!existing) return text(404, "Submission not found.");
    const body = JSON.parse(event.body || "{}");
    const updated = { ...existing, read: body.read !== false };
    await store.setJSON(id, updated);
    return json(200, updated);
  }

  return text(405, "Method not allowed");
}
