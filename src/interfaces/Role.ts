export interface Role {
  name: string;
  guard_name?: string;
  permissions: string[]; // Names of permissions
}
