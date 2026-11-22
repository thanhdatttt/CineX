import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { CinemasController } from './cinemas.controller';

describe('CinemasController access policy', () => {
  it('requires an authenticated admin for every cinema mutation', () => {
    const writes = [
      'create',
      'update',
      'deactivate',
      'activate',
      'archive',
    ] as const;
    for (const action of writes) {
      const handler = Object.getOwnPropertyDescriptor(
        CinemasController.prototype,
        action,
      )!.value as object;
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toHaveLength(2);
    }
  });
});
