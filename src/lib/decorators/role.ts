import { SetMetadata } from '@nestjs/common';
import { ROLE } from '../constants/roles';

export const ISADMINKEY = 'isAdmin';
export const IsRole = (role: keyof typeof ROLE) =>
  SetMetadata(ISADMINKEY, role);
