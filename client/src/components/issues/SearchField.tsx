import { useEffect, useState, type Ref } from 'react';
import { IconSearch } from '../ui/icons.tsx';
import { Kbd } from '../ui/Kbd.tsx';
import styles from './SearchField.module.css';

const DEBOUNCE_MS = 250;

interface SearchFieldProps {
  /** The committed search from the URL. */
  value: string;
  onCommit: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
}

/** Typing updates the URL after a short pause; Esc clears, and a second Esc leaves the field. */
export function SearchField({ value, onCommit, ref }: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);

  // Follow outside changes (Clear filters, back button) without fighting the user's typing.
  if (value !== committed) {
    setCommitted(value);
    if (value !== draft.trim()) setDraft(value);
  }

  useEffect(() => {
    const next = draft.trim();
    if (next === value) return;
    const timer = setTimeout(() => {
      onCommit(next);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, value, onCommit]);

  return (
    <label className={styles.field}>
      <IconSearch className={styles.icon} />
      <input
        ref={ref}
        type="search"
        className={styles.input}
        aria-label="Search issues"
        aria-keyshortcuts="/"
        placeholder="Search titles or #number"
        value={draft}
        dir="auto"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onCommit(draft.trim());
          } else if (event.key === 'Escape') {
            event.preventDefault();
            if (draft) {
              setDraft('');
              onCommit('');
            } else {
              event.currentTarget.blur();
            }
          }
        }}
      />
      {!draft && <Kbd className={styles.hint}>/</Kbd>}
    </label>
  );
}
