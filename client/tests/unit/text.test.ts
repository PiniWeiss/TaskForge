import { describe, expect, it } from 'vitest';
import { asSentence } from '../../src/lib/text.ts';

describe('asSentence', () => {
  it('adds a full stop only when the message lacks closing punctuation', () => {
    expect(asSentence('Internal server error')).toBe('Internal server error.');
    expect(asSentence('Already done.')).toBe('Already done.');
    expect(asSentence(' Really? ')).toBe('Really?');
  });
});
