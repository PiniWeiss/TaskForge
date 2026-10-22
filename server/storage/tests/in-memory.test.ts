import { InMemoryIssueRepository, InMemoryProjectRepository } from '@taskforge/storage';
import {
  describeIssueRepositoryContract,
  describeProjectRepositoryContract,
} from '@taskforge/storage/testing';

describeProjectRepositoryContract(
  'InMemoryProjectRepository',
  () => new InMemoryProjectRepository(),
);
describeIssueRepositoryContract('InMemoryIssueRepository', () => new InMemoryIssueRepository());
