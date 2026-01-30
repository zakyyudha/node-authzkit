import { Role } from './Role';
import { Permission } from './Permission';

export interface Authorizable {
  id: string | number;
  roles: Role[];
  permissions: Permission[];
}
