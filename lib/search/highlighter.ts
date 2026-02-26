/**
 * Keyword highlighting utility for search results
 */

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Split text into highlighted and non-highlighted segments based on query
 */
export function highlightText(text: string, query: string): HighlightSegment[] {
  if (!query.trim() || !text) {
    return [{ text, highlighted: false }];
  }

  const isChinese = /[\u4e00-\u9fff]/.test(query);
  const segments: HighlightSegment[] = [];

  if (isChinese) {
    // For Chinese, highlight matching characters/substrings
    const chars = query.match(/[\u4e00-\u9fff]+/g);
    if (!chars) return [{ text, highlighted: false }];

    // Sort by length descending for longest match first
    const patterns = chars.sort((a, b) => b.length - a.length);
    const escapedPatterns = patterns.map((p) =>
      p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`(${escapedPatterns.join('|')})`, 'g');

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), highlighted: false });
      }
      segments.push({ text: match[0], highlighted: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), highlighted: false });
    }
  } else {
    // For English, highlight matching words
    const words = query.toLowerCase().match(/[a-z']+/g);
    if (!words) return [{ text, highlighted: false }];

    const escapedWords = words.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`\\b(${escapedWords.join('|')})`, 'gi');

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), highlighted: false });
      }
      segments.push({ text: match[0], highlighted: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), highlighted: false });
    }
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }];
}
