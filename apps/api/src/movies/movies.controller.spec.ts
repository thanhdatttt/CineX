import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { MoviesController } from './movies.controller';

describe('MoviesController access policy', () => {
  it('requires an authenticated admin for every catalogue mutation', () => {
    const writes = [
      'create',
      'update',
      'publish',
      'unpublish',
      'archive',
      'searchTmdb',
      'getTmdbCandidate',
      'importTmdb',
    ] as const;
    for (const action of writes) {
      const handler = Object.getOwnPropertyDescriptor(
        MoviesController.prototype,
        action,
      )!.value as object;
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toHaveLength(2);
    }
  });
});
