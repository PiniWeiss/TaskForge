import type { Project } from '@taskforge/shared';
import { useOutletContext, useParams } from 'react-router';
import { IssuePanel } from '../components/issue-panel/IssuePanel.tsx';

export interface ProjectOutletContext {
  project: Project;
  closePanel: () => void;
}

/** `/p/:projectId/i/:issueId`: the detail panel beside the project's table. */
export function IssueRoute() {
  const { issueId = '' } = useParams();
  const { project, closePanel } = useOutletContext<ProjectOutletContext>();
  // Keyed by issue, so drafts in one issue's fields never leak into the next.
  return <IssuePanel key={issueId} project={project} issueId={issueId} onClose={closePanel} />;
}
