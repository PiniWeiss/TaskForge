import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateProject, useProjects } from '../../api/projects.ts';
import { paths } from '../../app/paths.ts';
import { IconPlus } from '../ui/icons.tsx';
import { ProjectList } from './ProjectList.tsx';
import { ProjectNameField } from './ProjectNameField.tsx';
import styles from './ProjectsSection.module.css';

interface ProjectsSectionProps {
  onNavigate: () => void;
}

export function ProjectsSection({ onNavigate }: ProjectsSectionProps) {
  const projects = useProjects();
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  // With no projects at all, the name field is the obvious first step, so it starts open.
  const showCreate = creating || projects.data?.length === 0;

  return (
    <section aria-labelledby="projects-heading">
      <div className={styles.head}>
        <h2 id="projects-heading" className={styles.label}>
          Projects
        </h2>
        <button
          type="button"
          className={styles.add}
          aria-label="New project"
          title="New project"
          aria-expanded={showCreate}
          onClick={() => {
            setCreating(true);
          }}
        >
          <IconPlus />
        </button>
      </div>
      <ProjectList onNavigate={onNavigate} />
      {showCreate && (
        <ProjectNameField
          label="New project name"
          placeholder="Project name"
          onCancel={() => {
            setCreating(false);
          }}
          onSubmit={async (name) => {
            const project = await createProject.mutateAsync(name);
            setCreating(false);
            onNavigate();
            void navigate(paths.project(project.id));
          }}
        />
      )}
    </section>
  );
}
