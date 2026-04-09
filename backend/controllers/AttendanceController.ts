import type { Request, Response } from 'express';
import { AttendanceService } from '../services/AttendanceService.ts';

export class AttendanceController {
  static async registerMedicalCertificate(req: Request, res: Response) {
    try {
      const certificate = await AttendanceService.registerMedicalCertificate(req.body);
      res.status(201).json(certificate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async index(req: Request, res: Response) {
    try {
      const { month } = req.query;
      const list = await AttendanceService.getAttendanceList(month as string);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
