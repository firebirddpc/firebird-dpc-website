import { connectLambda } from "@netlify/blobs";
import { contactStore, json, normalizeSubmission } from "./_contact-data.mjs";

// Public endpoint the website's contact form posts to. Does not rely on
// Netlify's own Forms bot-detection (which was confirmed, by direct testing
// against the live site, to be returning a 404 for every form-shaped POST
// request regardless of form-name — a site-level Netlify configuration
// issue, not something fixable from the app code). Storage uses the same
// Netlify Blobs infrastructure already proven reliable for blog posts.
export async function handler(event) {
  connectLambda(event);
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  let input;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid submission." });
  }
  try {
    const submission = normalizeSubmission(input);
    await contactStore().setJSON(submission.id, submission);
    return json(201, { ok: true });
  } catch (err) {
    return json(400, { error: err.message || "Could not submit the form." });
  }
}
