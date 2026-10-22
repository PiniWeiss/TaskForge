import type { IssueStatus, ListResponse, Project } from '@taskforge/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './endpoints.ts';
import { keys } from './keys.ts';

export function useProjects() {
  return useQuery({
    queryKey: keys.projects(),
    queryFn: ({ signal }) => api.listProjects(signal),
    select: (page) => page.data,
  });
}

/** Issue count for a project, optionally for one status. */
export function useIssueCount(projectId: string, status?: IssueStatus, enabled = true) {
  return useQuery({
    queryKey: keys.count(projectId, status),
    queryFn: ({ signal }) => api.countIssues(projectId, status, signal),
    enabled,
  });
}

/** Keeps the cached project list sorted like the API does (locale-aware by name). */
const collator = new Intl.Collator(['he', 'en']);
function sortByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => collator.compare(a.name, b.name) || a.id.localeCompare(b.id));
}

function updateProjectList(
  page: ListResponse<Project> | undefined,
  change: (projects: Project[]) => Project[],
): ListResponse<Project> | undefined {
  if (!page) return page;
  const data = sortByName(change(page.data));
  return { data, pagination: { ...page.pagination, total: data.length } };
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createProject(name),
    onSuccess: (created) => {
      queryClient.setQueryData<ListResponse<Project>>(keys.projects(), (page) =>
        updateProjectList(page, (projects) => [...projects, created]),
      );
      void queryClient.invalidateQueries({ queryKey: keys.projects() });
    },
  });
}

export function useRenameProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      api.renameProject(projectId, name),
    onSuccess: (renamed) => {
      queryClient.setQueryData<ListResponse<Project>>(keys.projects(), (page) =>
        updateProjectList(page, (projects) =>
          projects.map((p) => (p.id === renamed.id ? renamed : p)),
        ),
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.setQueryData<ListResponse<Project>>(keys.projects(), (page) =>
        updateProjectList(page, (projects) => projects.filter((p) => p.id !== projectId)),
      );
      queryClient.removeQueries({ queryKey: keys.project(projectId) });
    },
  });
}
