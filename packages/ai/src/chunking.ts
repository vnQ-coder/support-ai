/**
 * Text chunking utility for knowledge base ingestion.
 * Splits text into overlapping chunks that respect sentence boundaries.
 */

interface ChunkOptions {
  /** Maximum tokens per chunk (approximate, ~4 chars per token). Default: 500 */
  maxTokens?: number;
  /** Number of overlapping tokens between chunks. Default: 50 */
  overlap?: number;
}

/** Approximate token count — ~4 characters per token for English text. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text on sentence boundaries. Handles common abbreviations and
 * avoids splitting on decimal numbers or common patterns like "Dr." / "Mr.".
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Split text into chunks of approximately `maxTokens` tokens with `overlap`
 * token overlap between consecutive chunks. Respects sentence boundaries
 * so chunks don't break mid-sentence.
 *
 * @param text - The full text to chunk
 * @param options - Chunking configuration
 * @returns Array of chunk strings
 */
export function chunkText(
  text: string,
  options?: ChunkOptions
): string[] {
  const maxTokens = options?.maxTokens ?? 500;
  const overlap = options?.overlap ?? 50;

  // Clean up the input: normalize whitespace
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return [];

  // If the entire text fits in one chunk, return it as-is
  if (estimateTokens(cleaned) <= maxTokens) {
    return [cleaned];
  }

  const sentences = splitSentences(cleaned);
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let currentSentences: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    // If a single sentence exceeds maxTokens, force-split it by character count
    if (sentenceTokens > maxTokens) {
      // Flush current buffer first
      if (currentSentences.length > 0) {
        chunks.push(currentSentences.join(" "));
        currentSentences = [];
        currentTokens = 0;
      }

      // Force-split the long sentence into maxTokens-sized pieces
      const maxChars = maxTokens * 4;
      for (let i = 0; i < sentence.length; i += maxChars) {
        const slice = sentence.slice(i, i + maxChars).trim();
        if (slice.length > 0) {
          chunks.push(slice);
        }
      }
      continue;
    }

    // If adding this sentence would exceed the limit, flush the buffer
    if (currentTokens + sentenceTokens > maxTokens && currentSentences.length > 0) {
      chunks.push(currentSentences.join(" "));

      // Calculate overlap: walk backward from the end of currentSentences
      // to collect roughly `overlap` tokens worth of sentences
      const overlapSentences: string[] = [];
      let overlapTokens = 0;
      for (let i = currentSentences.length - 1; i >= 0; i--) {
        const st = estimateTokens(currentSentences[i]!);
        if (overlapTokens + st > overlap) break;
        overlapSentences.unshift(currentSentences[i]!);
        overlapTokens += st;
      }

      currentSentences = overlapSentences;
      currentTokens = overlapTokens;
    }

    currentSentences.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Flush remaining sentences
  if (currentSentences.length > 0) {
    const final = currentSentences.join(" ");
    // Avoid duplicating the last chunk if it's identical
    if (chunks.length === 0 || chunks[chunks.length - 1] !== final) {
      chunks.push(final);
    }
  }

  return chunks;
}
