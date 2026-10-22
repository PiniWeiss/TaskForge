import {
  ISSUE_PRIORITIES,
  TEXT_LIMITS,
  codePointLength,
  type Issue,
  type IssuePriority,
} from '@taskforge/shared';
import { useId, useState } from 'react';
import { useCreateIssue } from '../../api/issues.ts';
import { asSentence } from '../../lib/text.ts';
import { Button } from '../ui/Button.tsx';
import { Kbd } from '../ui/Kbd.tsx';
import { SelectMenu } from '../ui/SelectMenu.tsx';
import { formatIssueNumber, PRIORITY_LABELS } from './labels.ts';
import styles from './QuickAdd.module.css';

const PRIORITY_OPTIONS = [...ISSUE_PRIORITIES]
  .reverse()
  .map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

interface QuickAddProps {
  projectId: string;
  onClose: () => void;
  onOpenIssue: (issue: Issue) => void;
}

/**
 * Keyboard-first issue entry. Enter files the issue and keeps the field open for the next one;
 * Esc (or Cancel) closes. Priority starts at Medium and sticks between entries.
 */
export function QuickAdd({ projectId, onClose, onOpenIssue }: QuickAddProps) {
  const createIssue = useCreateIssue(projectId);
  const errorId = useId();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<Issue | null>(null);

  async function submit() {
    const trimmed = title.normalize('NFC').trim();
    if (trimmed === '') {
      setError('Give the issue a title.');
      return;
    }
    if (codePointLength(trimmed) > TEXT_LIMITS.title) {
      setError(`Keep the title to ${String(TEXT_LIMITS.title)} characters or fewer.`);
      return;
    }
    try {
      const created = await createIssue.mutateAsync({ title: trimmed, priority });
      setLastCreated(created);
      setTitle('');
      setError(null);
    } catch (err) {
      setError(
        `Couldn’t create it: ${asSentence(err instanceof Error ? err.message : 'Something went wrong.')}`,
      );
    }
  }

  return (
    <form
      className={styles.quickAdd}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      onKeyDown={(event) => {
        // Esc inside the open priority list only closes the list (its events bubble through the portal).
        const inList = event.target instanceof Element && event.target.closest('[role="listbox"]');
        if (event.key === 'Escape' && !event.defaultPrevented && !inList) {
          event.preventDefault();
          onClose();
        }
      }}
      aria-label="New issue"
    >
      <div className={styles.row}>
        <input
          className={styles.title}
          aria-label="Issue title"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          placeholder="Issue title"
          value={title}
          dir="auto"
          autoFocus
          autoComplete="off"
          readOnly={createIssue.isPending}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
        />
        <SelectMenu
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
        <Button type="submit" variant="primary" disabled={createIssue.isPending}>
          {createIssue.isPending ? 'Creating…' : 'Create'}
        </Button>
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <p className={styles.note} id={errorId} role={error ? 'alert' : 'status'}>
        {error ? (
          <span className={styles.error}>{error}</span>
        ) : lastCreated ? (
          <>
            Created{' '}
            <button
              type="button"
              className={styles.createdLink}
              onClick={() => {
                onOpenIssue(lastCreated);
              }}
            >
              {formatIssueNumber(lastCreated.number)}
            </button>
            . Keep typing to file another, or <Kbd>Esc</Kbd> to finish.
          </>
        ) : (
          <>
            <Kbd>Enter</Kbd> to create · <Kbd>Esc</Kbd> to close
          </>
        )}
      </p>
    </form>
  );
}
