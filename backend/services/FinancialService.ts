import prisma from '../config/database.ts';

export class FinancialService {
  static async getExpenses(filters: any) {
    return prisma.expense.findMany({
      where: filters,
      orderBy: { date: 'desc' },
    });
  }

  static async addExpense(data: any) {
    return prisma.expense.create({
      data,
    });
  }

  static async getDashboardData() {
    const expenses = await prisma.expense.findMany();
    
    const totalCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    const byCategory = expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    // Progress vs Cost logic
    const totalPlanned = await prisma.service.aggregate({
      _sum: { totalQuantity: true }
    });
    const totalExecuted = await prisma.service.aggregate({
      _sum: { executedQuantity: true }
    });

    const progressPercent = totalPlanned._sum.totalQuantity 
      ? (totalExecuted._sum.executedQuantity! / totalPlanned._sum.totalQuantity!) * 100 
      : 0;

    return {
      totalCost,
      byCategory,
      progressPercent,
      expensesCount: expenses.length
    };
  }
}
