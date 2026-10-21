// Public form ID from the owner's Formspree dashboard. Set only after the
// target email is verified; no API or SMTP credentials belong in this bundle.
export const FORM_ENDPOINT = "";

export function isFormEndpoint(value) {
  return typeof value === "string" && /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(value);
}

export async function sendInquiry(draft, topic, signal, fetchImpl = fetch, endpoint = FORM_ENDPOINT) {
  if (!isFormEndpoint(endpoint)) throw new Error("Contact form is not configured");
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: draft.name.trim(),
      company: draft.company.trim(),
      email: draft.email.trim(),
      message: draft.message.trim(),
      _subject: topic || "Partnership inquiry — PLIPLY",
      _gotcha: draft.honey,
    }),
    credentials: "omit",
    referrerPolicy: "origin",
    redirect: "error",
    signal,
  });
  const result = await response.json();
  if (!response.ok || result?.error || Array.isArray(result?.errors) || typeof result?.next !== "string") {
    throw new Error("Submission not accepted");
  }
}
