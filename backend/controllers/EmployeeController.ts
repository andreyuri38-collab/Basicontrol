import { Request, Response } from 'express';
import { EmployeeService } from '../services/EmployeeService';

export class EmployeeController {
  static async index(req: Request, res: Response) {
    try {
      const employees = await EmployeeService.getAll(req.query);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getNextCode(req: Request, res: Response) {
    try {
      const nextCode = await EmployeeService.getNextCode();
      res.json({ nextCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async terminate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { date } = req.body;
      const employee = await EmployeeService.terminate(Number(id), date);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async import(req: Request, res: Response) {
    try {
      const employees = await EmployeeService.importEmployees(req.body);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
