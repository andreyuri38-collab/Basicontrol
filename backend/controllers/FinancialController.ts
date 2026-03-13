import { Request, Response } from 'express';
import { FinancialService } from '../services/FinancialService';

export class FinancialController {
  static async index(req: Request, res: Response) {
    try {
      const expenses = await FinancialService.getExpenses(req.query);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async store(req: Request, res: Response) {
    try {
      const expense = await FinancialService.addExpense(req.body);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async dashboard(req: Request, res: Response) {
    try {
      const data = await FinancialService.getDashboardData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
