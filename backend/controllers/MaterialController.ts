import type { Request, Response } from 'express';
import { MaterialService } from '../services/MaterialService.ts';

export class MaterialController {
  static async requirements(req: Request, res: Response) {
    try {
      const requirements = await MaterialService.calculateRequirements();
      res.json(requirements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
