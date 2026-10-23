/** Ends an API message with a full stop so it can be followed by another sentence. */
export function asSentence(message: string): string {
  const trimmed = message.trim();
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
