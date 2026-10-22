import type { Project } from '@taskforge/shared';
import { useIssueCount } from '../../api/projects.ts';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<unknown>;
}

function describeIssues(count: number | undefined): string {
  if (count === undefined) return 'its issues';
  if (count === 0) return 'no issues';
  return count === 1 ? '1 issue' : `${String(count)} issues`;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  const total = useIssueCount(project.id, undefined, open);
  const issues = describeIssues(total.data);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          Delete <span dir="auto">{project.name}</span>?
        </>
      }
      description={
        total.data === 0
          ? 'The project has no issues. Deleting it can’t be undone.'
          : `This also deletes ${issues}. It can’t be undone.`
      }
      confirmLabel="Delete project"
      pendingLabel="Deleting…"
      onConfirm={onConfirm}
    />
  );
}
