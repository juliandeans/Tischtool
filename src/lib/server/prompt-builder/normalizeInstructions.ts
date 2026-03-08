import type { PromptInstructionDebug } from '$lib/types/generation';

const trimValue = (value: string) => value.trim();

const splitFragments = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((fragment) => trimValue(fragment))
    .filter(Boolean);

export const normalizeUserInstructions = (rawInput: string): PromptInstructionDebug => {
  const cleaned = trimValue(rawInput).replace(/\r\n/g, '\n');

  if (!cleaned) {
    return {
      rawInput: '',
      normalizedLines: []
    };
  }

  const normalizedLines = splitFragments(rawInput);

  return {
    rawInput: cleaned,
    normalizedLines
  };
};
