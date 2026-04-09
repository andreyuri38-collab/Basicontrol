import type { Request, Response } from 'express';
import { EnvironmentService } from '../services/EnvironmentService.ts';

export class EnvironmentController {
  static async index(req: Request, res: Response) {
    try {
      const environments = await EnvironmentService.getAll();
      res.json(environments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFlowchart(req: Request, res: Response) {
    try {
      const data = await EnvironmentService.getFlowchartData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async store(req: Request, res: Response) {
    try {
      const environment = await EnvironmentService.create(req.body);
      res.status(201).json(environment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const environment = await EnvironmentService.update(Number(id), req.body);
      res.json(environment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
