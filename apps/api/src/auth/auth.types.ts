import { UserRole } from '../generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
