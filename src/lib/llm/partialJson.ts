/**
 * Tolerant partial-JSON parsing for streaming LLM output.
 *
 * While a model streams a JSON object token-by-token, the accumulated text is
 * usually *invalid* JSON (an unterminated string, a half-written array, a
 * dangling key). `parsePartialJson` returns the best-effort object that can be
 * recovered from such a prefix so the UI can reveal fields as they arrive.
 *
 * It is purely additive: every call site treats a `null` (or stale) result as
 * "no update this tick", and the final, complete response is always validated
 * through the normal schema path. A wrong guess mid-stream is therefore
 * harmless — it just means a field appears a few hundred milliseconds later.
 */

/** Close any open strings/brackets in a JSON prefix so it can be parsed. */
function closeOpenStructures(prefix: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let closed = prefix;
  if (inString) closed += '"';
  for (let i = stack.length - 1; i >= 0; i--) closed += stack[i];
  return closed;
}

export function parsePartialJson(raw: string): unknown | null {
  if (!raw) return null;

  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const start = s.indexOf("{");
  if (start < 0) return null;
  s = s.slice(start);

  // Fast path: already-valid JSON (e.g. the completed object).
  try {
    return JSON.parse(s);
  } catch {
    // fall through to recovery
  }

  // Walk back from the end to the last structural boundary, close the open
  // strings/brackets, and try to parse. The first prefix that parses is the
  // richest recoverable object. Only probe at boundary characters to bound work.
  for (let end = s.length; end > 1; end--) {
    const ch = s[end - 1];
    if (ch !== '"' && ch !== "}" && ch !== "]" && ch !== ",") continue;
    // Drop a trailing comma so we don't produce `[1,]` style invalid JSON.
    const prefix = s.slice(0, end).replace(/,\s*$/, "");
    try {
      return JSON.parse(closeOpenStructures(prefix));
    } catch {
      // keep walking back
    }
  }

  return null;
}
