import type { Request, Response } from 'express';
import { ServiceService } from '../services/ServiceService.ts';

export class ServiceController {
  static async index(req: Request, res: Response) {
    try {
      const services = await ServiceService.getAll();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async store(req: Request, res: Response) {
    try {
      const service = await ServiceService.create(req.body);
      res.status(201).json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await ServiceService.update(Number(id), req.body);
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async destroy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ServiceService.delete(Number(id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
