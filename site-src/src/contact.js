export async function sendInquiry(draft, topic, signal, fetchImpl = fetch) {
  const response = await fetchImpl("https://formsubmit.co/ajax/adm@pliply.pro", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: draft.name.trim(),
      company: draft.company.trim(),
      email: draft.email.trim(),
      message: draft.message.trim(),
      _subject: topic || "Partnership inquiry — PLIPLY",
      _honey: draft.honey,
      _captcha: "false",
    }),
    credentials: "omit",
    referrerPolicy: "origin",
    signal,
  });
  const result = await response.json();
  if (!response.ok || (result.success !== true && result.success !== "true")) {
    throw new Error("Submission not accepted");
  }
}
