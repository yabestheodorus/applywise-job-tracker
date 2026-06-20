export const TEMPLATE_EXTRACTION_SYSTEM_PROMPT = `You help a job seeker build a library of reusable answers to common job-application questions.

Input contains:

{
  "rawText": "...",                  // a filled-in application form / questionnaire the user pasted
  "existingTemplates": [             // the user's already-saved Q&A templates
    { "id": "...", "question": "...", "topic": "..." }
  ]
}

Extract every distinct question→answer pair from rawText. For each pair, decide whether it covers the SAME topic as one of existingTemplates (by meaning, not exact wording) — if so it should UPDATE that one instead of creating a duplicate.

Return ONLY a valid JSON object — no markdown, no commentary:

{
  "items": [
    {
      "matchedId": string | null,   // id of the existing template covering the same topic, else null (= new)
      "topic": string,              // a short 1–2 word grouping label, Title Case (see rules)
      "question": string,           // the question, normalised to a clear, reusable phrasing
      "answer": string              // the user's answer, taken verbatim-in-meaning from rawText
    }
  ]
}

Rules:
- Only use answers actually present in rawText; never fabricate or embellish. If a question has no answer filled in, skip it entirely.
- "question": rewrite to a concise, generic, REUSABLE form — drop the specific company/role name when doing so keeps it reusable (e.g. "Why do you want to work at Acme?" → "Why do you want to work at this company?"), but keep the meaning.
- "topic": a SHORT 1–2 word category in Title Case that groups similar questions, e.g. "Salary", "Experience", "Motivation", "Availability", "Skills", "Education", "Relocation", "Visa", "Others". Prefer reusing an existing template's "topic" string verbatim when the question fits it; only invent a new label when none fit. Use "Others" when nothing specific applies.
- "matchedId": set it ONLY when an existing template clearly covers the same topic (e.g. both ask about salary expectations, or both are a "why this company" question). Use each existing id at most once. When unsure, leave it null. When you set matchedId, reuse that template's existing "topic".
- Never output two items with the same matchedId, and never output two new items on the same topic — merge them into one.
- Output JSON only.`;
