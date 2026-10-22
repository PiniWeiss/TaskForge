import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  TEXT_LIMITS,
  codePointLength,
  type Issue,
  type PatchIssueInput,
  type Project,
} from '@taskforge/shared';
import { useState } from 'react';
import { usePatchIssue } from '../../api/issues.ts';
import { asSentence } from '../../lib/text.ts';
import { formatAbsolute } from '../../lib/time.ts';
import { PRIORITY_LABELS, STATUS_LABELS } from '../issues/labels.ts';
import { PriorityLabel } from '../issues/PriorityLabel.tsx';
import { StatusLabel } from '../issues/StatusLabel.tsx';
import { RelativeTime } from '../ui/RelativeTime.tsx';
import { InlineTextField } from './InlineTextField.tsx';
import styles from './IssueDetail.module.css';
import { PropertySelect } from './PropertySelect.tsx';
import { SaveStatus, type SaveState } from './SaveStatus.tsx';

// Highest first in the list, matching how people triage.
const PRIORITY_CHOICES = [...ISSUE_PRIORITIES].reverse();

type Field = 'title' | 'description' | 'status' | 'priority';

function validateTitle(title: string): string | null {
  if (title === '') return 'An issue needs a title.';
  if (codePointLength(title) > TEXT_LIMITS.title) {
    return `Keep the title to ${String(TEXT_LIMITS.title)} characters or fewer.`;
  }
  return null;
}

function validateDescription(description: string): string | null {
  return codePointLength(description) > TEXT_LIMITS.description
    ? `Keep the description to ${String(TEXT_LIMITS.description)} characters or fewer.`
    : null;
}

interface IssueDetailProps {
  project: Project;
  issue: Issue;
}

export function IssueDetail({ project, issue }: IssueDetailProps) {
  const patch = usePatchIssue(project.id);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [selectError, setSelectError] = useState<{ field: Field; message: string } | null>(null);

  async function save(field: Field, changes: PatchIssueInput) {
    setSaveState({ kind: 'saving' });
    try {
      await patch.mutateAsync({ issueId: issue.id, changes });
      setSaveState({ kind: 'saved' });
    } catch (err) {
      setSaveState({ kind: 'error', field });
      throw err;
    }
  }

  function saveProperty(field: 'status' | 'priority', changes: PatchIssueInput) {
    setSelectError(null);
    save(field, changes).catch((err: unknown) => {
      const reason = err instanceof Error ? err.message : 'Something went wrong.';
      setSelectError({
        field,
        message: `Couldn’t save: ${asSentence(reason)} The previous value is back.`,
      });
    });
  }

  return (
    <div className={styles.detail}>
      <InlineTextField
        label="Title"
        value={issue.title}
        validate={validateTitle}
        onSave={(title) => save('title', { title })}
      />

      <dl className={styles.properties}>
        <div className={styles.property}>
          <dt>Status</dt>
          <dd>
            <PropertySelect
              label="Status"
              value={issue.status}
              options={ISSUE_STATUSES}
              render={(status) => <StatusLabel status={status} />}
              describe={(status) => STATUS_LABELS[status]}
              onChange={(status) => {
                saveProperty('status', { status });
              }}
            />
            {selectError?.field === 'status' && (
              <p className={styles.fieldError} role="alert">
                {selectError.message}
              </p>
            )}
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Priority</dt>
          <dd>
            <PropertySelect
              label="Priority"
              value={issue.priority}
              options={PRIORITY_CHOICES}
              render={(priority) => <PriorityLabel priority={priority} />}
              describe={(priority) => PRIORITY_LABELS[priority]}
              onChange={(priority) => {
                saveProperty('priority', { priority });
              }}
            />
            {selectError?.field === 'priority' && (
              <p className={styles.fieldError} role="alert">
                {selectError.message}
              </p>
            )}
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Created</dt>
          <dd className={styles.time}>
            <RelativeTime iso={issue.createdAt} style="long" />
            <span className={styles.exact}>{formatAbsolute(issue.createdAt)}</span>
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Updated</dt>
          <dd className={styles.time}>
            <RelativeTime iso={issue.updatedAt} style="long" />
          </dd>
        </div>
      </dl>

      <section className={styles.descriptionSection} aria-labelledby="issue-description-label">
        <h3 id="issue-description-label" className={styles.sectionLabel}>
          Description
        </h3>
        <InlineTextField
          label="Description"
          value={issue.description ?? ''}
          multiline
          placeholder="Add context: what happens, what should happen, how to reproduce."
          validate={validateDescription}
          onSave={(description) => save('description', { description })}
        />
      </section>

      <SaveStatus state={saveState} />
    </div>
  );
}
