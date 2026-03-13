import { Request, Response } from 'express';
import { PlanningService } from '../services/PlanningService';

export class PlanningController {
  static async index(req: Request, res: Response) {
    try {
      const plannings = await PlanningService.getAll(req.query);
      res.json(plannings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async store(req: Request, res: Response) {
    try {
      const planning = await PlanningService.create(req.body);
      res.status(201).json(planning);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const planning = await PlanningService.update(Number(req.params.id), req.body);
      res.json(planning);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async destroy(req: Request, res: Response) {
    try {
      await PlanningService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async forecasts(req: Request, res: Response) {
    try {
      const forecasts = await PlanningService.getForecasts();
      res.json(forecasts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
