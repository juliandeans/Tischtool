import type { PromptInstructionDebug } from '$lib/types/generation';

const ATMOSPHERE_HINTS = new Set(['ruhiger', 'gemuetlicher', 'gemütlicher', 'wohnlicher']);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const toLookup = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim();

const splitFragments = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((fragment) => normalizeWhitespace(fragment))
    .filter(Boolean);

export const normalizeUserInstructions = (rawInput: string): PromptInstructionDebug => {
  const cleaned = normalizeWhitespace(rawInput);

  if (!cleaned) {
    return {
      rawInput: '',
      normalizedLines: []
    };
  }

  const normalizedLines = splitFragments(cleaned).filter(
    (fragment) => !ATMOSPHERE_HINTS.has(toLookup(fragment))
  );

  return {
    rawInput: cleaned,
    normalizedLines
  };
};
