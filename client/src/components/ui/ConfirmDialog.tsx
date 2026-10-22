import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while onConfirm runs: "Deleting…". */
  pendingLabel: string;
  /** Rejecting keeps the dialog open and shows the error's message inside it. */
  onConfirm: () => Promise<unknown>;
}

/** A destructive confirmation. Focus starts on Cancel, so Enter never deletes by accident. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.content}>
          <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={styles.description}>
            {description}
          </AlertDialog.Description>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <AlertDialog.Cancel asChild>
              <Button variant="quiet">Cancel</Button>
            </AlertDialog.Cancel>
            {/* Not AlertDialog.Action: that would close before the request finishes. */}
            <Button variant="danger" disabled={pending} onClick={() => void confirm()}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
