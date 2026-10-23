import clsx from 'clsx';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { asSentence } from '../../lib/text.ts';
import styles from './InlineTextField.module.css';

interface InlineTextFieldProps {
  label: string;
  value: string;
  /** Saves on blur. Rejecting means the change was rolled back; the error shows under the field. */
  onSave: (value: string) => Promise<unknown>;
  validate?: (value: string) => string | null;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Text that is always editable in place. Blur saves, Enter saves a single-line field, Esc puts the
 * saved text back. While the field has focus, outside updates never overwrite what is being typed.
 */
export function InlineTextField({
  label,
  value,
  onSave,
  validate,
  multiline = false,
  placeholder,
  className,
}: InlineTextFieldProps) {
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(value);
  // Esc blurs the field to finish; that blur must not save the text Esc just discarded.
  const discardOnBlur = useRef(false);

  // Server value changed (save landed, rollback, refetch): follow it unless the user is typing.
  if (value !== seen) {
    setSeen(value);
    if (!focused) setDraft(value);
  }

  async function commit() {
    const next = draft.normalize('NFC').trim();
    if (next === value) {
      setDraft(value);
      setError(null);
      return;
    }
    const problem = validate?.(next) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setDraft(next);
    try {
      await onSave(next);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Something went wrong.';
      setError(`Couldn’t save: ${asSentence(reason)} The previous text is back.`);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      discardOnBlur.current = true;
      setDraft(value);
      setError(null);
      event.currentTarget.blur();
    } else if (event.key === 'Enter' && !multiline && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <div className={clsx(styles.wrapper, className)}>
      <textarea
        className={clsx(styles.field, multiline ? styles.multiline : styles.single)}
        aria-label={label}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        value={draft}
        placeholder={placeholder}
        rows={multiline ? 4 : 1}
        dir="auto"
        spellCheck={multiline}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          if (discardOnBlur.current) {
            discardOnBlur.current = false;
            return;
          }
          void commit();
        }}
        onKeyDown={onKeyDown}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
