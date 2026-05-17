export type SanitizedExternalDocument = Readonly<{
  text: string;
  originalLength: number;
  sanitizedLength: number;
  truncated: boolean;
  injectionPatternDetected: boolean;
  flags: readonly string[];
}>;

const defaultMaxLength = 120_000;
const htmlTagPattern = /<[^>]*>/g;
const controlCharacterPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const injectionPatterns: readonly [string, RegExp][] = [
  ["prompt_override", /\b(ignore|forget|override)\b.{0,80}\b(previous|prior|system|developer)\b.{0,80}\b(instructions?|messages?)\b/i],
  ["role_impersonation", /\b(system|developer|assistant)\s*:/i],
  ["secret_exfiltration", /\b(api[_-]?key|token|password|secret|credential)\b/i],
  ["tool_directive", /\b(call|invoke|use)\b.{0,40}\b(tool|function|browser|shell)\b/i],
];

export function sanitizeExternalSourceDocument(
  input: string,
  maxLength = defaultMaxLength,
): SanitizedExternalDocument {
  const originalLength = input.length;
  const withoutHtml = input.replace(htmlTagPattern, " ");
  const withoutControlCharacters = withoutHtml.replace(controlCharacterPattern, "");
  const normalizedWhitespace = withoutControlCharacters.replace(/\s+/g, " ").trim();
  const truncated = normalizedWhitespace.length > maxLength;
  const text = truncated
    ? normalizedWhitespace.slice(0, maxLength).trimEnd()
    : normalizedWhitespace;
  const flags = injectionPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([flag]) => flag);

  return {
    text,
    originalLength,
    sanitizedLength: text.length,
    truncated,
    injectionPatternDetected: flags.length > 0,
    flags,
  };
}
