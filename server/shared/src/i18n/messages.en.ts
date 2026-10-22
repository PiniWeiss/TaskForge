// English message catalog.

export const messagesEn = {
  'error.validation': 'Invalid request',
  'error.malformedJson': 'Malformed JSON body',
  'error.notFound.project': 'Project {id} not found',
  'error.notFound.issue': 'Issue {id} not found',
  'error.notFound.route': 'Route {method} {path} not found',
  'error.conflict.projectName': 'A project named "{name}" already exists',
  'error.internal': 'Internal server error',

  'validation.required': 'is required',
  'validation.invalidType': 'expected {expected}',
  'validation.empty': 'must not be empty',
  'validation.tooShort': 'must be at least {minimum} characters',
  'validation.tooLong': 'must be at most {maximum} characters',
  'validation.tooSmall': 'must be at least {minimum}',
  'validation.tooBig': 'must be at most {maximum}',
  'validation.invalidValue': 'must be one of: {values}',
  'validation.invalidFormat': 'must be a valid {format}',
  'validation.unrecognizedKeys': 'unknown field(s): {keys}',
  'validation.atLeastOneField': 'at least one field is required',
  'validation.invalid': 'is invalid',
} as const;

export type MessageKey = keyof typeof messagesEn;
