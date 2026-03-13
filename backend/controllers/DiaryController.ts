import { Request, Response } from 'express';
import { DiaryService } from '../services/DiaryService';

export class DiaryController {
  static async index(req: Request, res: Response) {
    try {
      const entries = await DiaryService.getEntries(req.query);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async store(req: Request, res: Response) {
    try {
      const entry = await DiaryService.createEntry(req.body);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async show(req: Request, res: Response) {
    try {
      const entry = await DiaryService.getEntryByDate(req.params.date);
      if (!entry) return res.status(404).json({ error: 'Entry not found' });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
