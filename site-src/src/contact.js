// Public form endpoint; no account credentials or mail keys are needed in the site.
export const FORM_ENDPOINT = "https://formspree.io/f/xyekqqne";

export async function sendInquiry(draft, topic, signal, fetchImpl = fetch) {
  const response = await fetchImpl(FORM_ENDPOINT, {
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
