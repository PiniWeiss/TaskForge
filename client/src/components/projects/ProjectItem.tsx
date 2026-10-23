import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { Project } from '@taskforge/shared';
import clsx from 'clsx';
import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import { useDeleteProject, useIssueCount, useRenameProject } from '../../api/projects.ts';
import { paths } from '../../app/paths.ts';
import { IconMore } from '../ui/icons.tsx';
import { MenuContent, MenuItem, MenuRoot, MenuSeparator, MenuTrigger } from '../ui/Menu.tsx';
import { DeleteProjectDialog } from './DeleteProjectDialog.tsx';
import styles from './ProjectItem.module.css';
import { ProjectNameField } from './ProjectNameField.tsx';

interface ProjectItemProps {
  project: Project;
  onNavigate: () => void;
}

export function ProjectItem({ project, onNavigate }: ProjectItemProps) {
  const openCount = useIssueCount(project.id, 'open');
  const renameProject = useRenameProject();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();
  const { projectId: currentId } = useParams();
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (renaming) {
    return (
      <li>
        <ProjectNameField
          label={`Rename ${project.name}`}
          defaultValue={project.name}
          onCancel={() => {
            setRenaming(false);
          }}
          onSubmit={async (name) => {
            await renameProject.mutateAsync({ projectId: project.id, name });
            setRenaming(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={styles.item}>
      <NavLink
        to={paths.project(project.id)}
        className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
        onClick={onNavigate}
      >
        <span className={styles.name} dir="auto">
          {project.name}
        </span>
        {openCount.isSuccess && (
          <span className={styles.count} title={`${String(openCount.data)} open`}>
            {openCount.data}
            <VisuallyHidden.Root> open</VisuallyHidden.Root>
          </span>
        )}
      </NavLink>

      <MenuRoot>
        <MenuTrigger className={styles.more} aria-label={`Actions for ${project.name}`}>
          <IconMore />
        </MenuTrigger>
        <MenuContent align="start">
          <MenuItem
            onSelect={() => {
              setRenaming(true);
            }}
          >
            Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            danger
            onSelect={() => {
              setConfirmingDelete(true);
            }}
          >
            Delete…
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <DeleteProjectDialog
        project={project}
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={async () => {
          await deleteProject.mutateAsync(project.id);
          if (currentId === project.id) void navigate(paths.home(), { replace: true });
        }}
      />
    </li>
  );
}
