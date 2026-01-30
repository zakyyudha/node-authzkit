import { Router } from 'express';
import { Authzkit } from '../../classes/Authzkit';

const router: Router = Router();

router.get('/', async (req, res) => {
  try {
    const authzkit = Authzkit.getInstance();
    const permissions = await authzkit.getPermissions();
    res.json(permissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, guard_name } = req.body;
    const authzkit = Authzkit.getInstance();
    const permission = await authzkit.definePermission(name, guard_name);
    res.status(201).json(permission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const authzkit = Authzkit.getInstance();
    await authzkit.deletePermission(name);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
