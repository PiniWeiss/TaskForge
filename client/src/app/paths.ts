// URL builders, so links and navigation never hand-assemble paths.

export const paths = {
  home: () => '/',
  project: (projectId: string, search = '') => `/p/${projectId}${search}`,
  issue: (projectId: string, issueId: string, search = '') =>
    `/p/${projectId}/i/${issueId}${search}`,
};
