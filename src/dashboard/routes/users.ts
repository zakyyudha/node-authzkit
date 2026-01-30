import { Router } from 'express';
import { Authzkit } from '../../classes/Authzkit';
import { Authorizable } from '../../interfaces/Authorizable';

const router: Router = Router();

router.get('/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    const roles = await authzkit.getUserRoles(user);
    res.json(Array.from(roles));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    await authzkit.assignRole(user, roleName);
    res.status(201).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:userId/roles/:roleName', async (req, res) => {
  try {
    const { userId, roleName } = req.params;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    await authzkit.revokeRole(user, roleName);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/permissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    const permissions = await authzkit.getUserPermissions(user);
    res.json(Array.from(permissions));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:userId/permissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissionName } = req.body;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    await authzkit.assignPermission(user, permissionName);
    res.status(201).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:userId/permissions/:permissionName', async (req, res) => {
  try {
    const { userId, permissionName } = req.params;
    const user: Authorizable = { id: userId, roles: [], permissions: [] };
    const authzkit = Authzkit.getInstance();
    await authzkit.revokePermission(user, permissionName);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
