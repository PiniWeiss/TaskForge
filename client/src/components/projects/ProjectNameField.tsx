import { TEXT_LIMITS, codePointLength } from '@taskforge/shared';
import { useId, useState, type KeyboardEvent } from 'react';
import styles from './ProjectNameField.module.css';

interface ProjectNameFieldProps {
  /** Accessible name of the input: "New project name", "Rename Payments". */
  label: string;
  defaultValue?: string;
  placeholder?: string;
  /** Resolves when saved; rejects with an Error whose message is shown inline. */
  onSubmit: (name: string) => Promise<unknown>;
  onCancel: () => void;
}

/** Same rules the API enforces, checked first so obvious mistakes never round-trip. */
function validate(name: string): string | null {
  if (name === '') return 'Give the project a name.';
  if (codePointLength(name) > TEXT_LIMITS.name) {
    return `Keep it to ${String(TEXT_LIMITS.name)} characters or fewer.`;
  }
  return null;
}

/** Inline name editor: Enter saves, Esc cancels, leaving it untouched cancels too. */
export function ProjectNameField({
  label,
  defaultValue = '',
  placeholder,
  onSubmit,
  onCancel,
}: ProjectNameFieldProps) {
  const errorId = useId();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    const name = value.normalize('NFC').trim();
    if (name === defaultValue.trim() && name !== '') {
      onCancel();
      return;
    }
    const problem = validate(name);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    try {
      await onSubmit(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the name.');
      setPending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <input
        className={styles.input}
        aria-label={label}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder}
        value={value}
        dir="auto"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        readOnly={pending}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Clicking away from an untouched or empty field means "never mind".
          if (!pending && (value.trim() === '' || value.trim() === defaultValue.trim())) onCancel();
        }}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
