import { SetMetadata } from '@nestjs/common';

export const AUTH_ROLES_KEY = 'auth_roles';

export type AuthRole = 'ADMIN' | 'TRADER' | 'CONSULTANT' | 'LEGAL_USER';

export const Roles = (...roles: AuthRole[]) =>
  SetMetadata(AUTH_ROLES_KEY, roles);
