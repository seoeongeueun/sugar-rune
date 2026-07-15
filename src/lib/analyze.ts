function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s.,!?;:()[\]{}"'“”‘’/\\|]+/)
    .filter(Boolean);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);

  const currentRow = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    currentRow[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;

      currentRow[j] = Math.min(
        previousRow[j] + 1,
        currentRow[j - 1] + 1,
        previousRow[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= b.length; j++) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length];
}

function getCharacterChangeRatio(previous: string, current: string): number {
  if (previous === current) return 0;

  const longestLength = Math.max(previous.length, current.length, 1);

  return levenshteinDistance(previous, current) / longestLength;
}

function getWordChangeRatio(previous: string, current: string): number {
  const previousWords = new Set(tokenize(previous));
  const currentWords = new Set(tokenize(current));

  const union = new Set([...previousWords, ...currentWords]);

  if (union.size === 0) return 0;

  let intersection = 0;

  for (const word of previousWords) {
    if (currentWords.has(word)) {
      intersection++;
    }
  }

  const similarity = intersection / union.size;

  return 1 - similarity;
}

// Evaluates whether a note should be reclassified based on the changes in its content.
// current ratio = 20% character change or 35% word change
export function shouldReclassify(
  previousContent: string,
  currentContent: string,
): boolean {
  if (previousContent === currentContent) return false;

  const characterChangeRatio = getCharacterChangeRatio(
    previousContent,
    currentContent,
  );
  const wordChangeRatio = getWordChangeRatio(previousContent, currentContent);

  const shouldReclassify =
    characterChangeRatio >= 0.2 || wordChangeRatio >= 0.35;

  console.log(
    `Character Change Ratio: ${characterChangeRatio}, Word Change Ratio: ${wordChangeRatio}; Should Reclassify: ${shouldReclassify}`,
  );
  return shouldReclassify;
}
