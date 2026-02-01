import { Router } from 'express';
import { Authzkit } from '../../classes/Authzkit';

const router: Router = Router();

router.get('/', async (req, res) => {
  try {
    const authzkit = Authzkit.getInstance();
    const roles = await authzkit.getRoles();
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, permissions, guard_name } = req.body;
    const authzkit = Authzkit.getInstance();
    const role = await authzkit.defineRole(name, permissions, guard_name);
    res.status(201).json(role);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:name/permissions', async (req, res) => {
  try {
    const { name } = req.params;
    const { permissionName } = req.body;
    const authzkit = Authzkit.getInstance();
    const role = await authzkit.addPermissionToRole(name, permissionName);
    res.status(200).json(role);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:name/permissions/:permissionName', async (req, res) => {
  try {
    const { name, permissionName } = req.params;
    const authzkit = Authzkit.getInstance();
    const role = await authzkit.removePermissionFromRole(name, permissionName);
    res.status(200).json(role);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const authzkit = Authzkit.getInstance();
    await authzkit.deleteRole(name);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
