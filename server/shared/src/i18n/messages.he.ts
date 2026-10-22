// Hebrew message catalog.

import type { MessageKey } from './messages.en.ts';

export const messagesHe: Record<MessageKey, string> = {
  'error.validation': 'בקשה לא תקינה',
  'error.malformedJson': 'גוף JSON לא תקין',
  'error.notFound.project': 'הפרויקט {id} לא נמצא',
  'error.notFound.issue': 'הסוגיה {id} לא נמצאה',
  'error.notFound.route': 'הנתיב {method} {path} לא נמצא',
  'error.internal': 'שגיאת שרת פנימית',

  'validation.required': 'שדה חובה',
  'validation.invalidType': 'נדרש ערך מסוג {expected}',
  'validation.empty': 'לא יכול להיות ריק',
  'validation.tooShort': 'חייב להכיל לפחות {minimum} תווים',
  'validation.tooLong': 'יכול להכיל לכל היותר {maximum} תווים',
  'validation.tooSmall': 'חייב להיות לפחות {minimum}',
  'validation.tooBig': 'יכול להיות לכל היותר {maximum}',
  'validation.invalidValue': 'חייב להיות אחד מ: {values}',
  'validation.invalidFormat': 'חייב להיות {format} תקין',
  'validation.unrecognizedKeys': 'שדות לא מוכרים: {keys}',
  'validation.atLeastOneField': 'יש לציין לפחות שדה אחד',
  'validation.invalid': 'ערך לא תקין',
};
