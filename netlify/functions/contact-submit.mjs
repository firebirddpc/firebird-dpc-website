import { connectLambda } from "@netlify/blobs";
import { contactStore, json, normalizeSubmission } from "./_contact-data.mjs";

async function sendContactEmail(submission) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email notification is not configured.");
  const lines = ["New Firebird DPC website inquiry", "", "Name: " + (submission.fullName || "Not provided"), "Email: " + (submission.email || "Not provided"), "Phone: " + (submission.phone || "Not provided"), "Preferred contact: " + (submission.preferredContact || "Not provided"), "Membership interest: " + (submission.membershipInterest || "Not provided"), "Best time to contact: " + (submission.bestTime || "Not provided"), "Question: " + (submission.mainQuestion || "Not provided")];
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify({ from: "Firebird DPC Website <website@firebirddpc.com>", to: ["info@firebirddpc.com"], reply_to: submission.email || "info@firebirddpc.com", subject: "New Firebird DPC website inquiry", text: lines.join("\\n") }) });
  if (!response.ok) throw new Error("Email notification failed.");
}

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
    await sendContactEmail(submission);
    return json(201, { ok: true, stored: true, emailSent: true });
  } catch (err) {
    return json(400, { error: err.message || "Could not submit the form." });
  }
}
