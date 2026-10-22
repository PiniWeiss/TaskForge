// translate(key, locale, params) and locale resolution.

import { messagesEn, type MessageKey } from './messages.en.ts';
import { messagesHe } from './messages.he.ts';

export const LOCALES = ['en', 'he'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type MessageParams = Record<string, string | number>;

const catalogs: Record<Locale, Record<MessageKey, string>> = { en: messagesEn, he: messagesHe };

export function isMessageKey(value: unknown): value is MessageKey {
  return typeof value === 'string' && Object.hasOwn(messagesEn, value);
}

/** Looks up `key` in the locale's catalog and fills `{name}` placeholders from `params`. */
export function translate(key: MessageKey, locale: Locale, params: MessageParams = {}): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
