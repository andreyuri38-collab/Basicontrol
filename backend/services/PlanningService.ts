import prisma from '../config/database';

export class PlanningService {
  static async getAll(filters: any) {
    return prisma.planning.findMany({
      where: filters,
      include: {
        activity: true,
        environment: true,
      },
      orderBy: { startDate: 'asc' },
    });
  }

  static async create(data: any) {
    return prisma.planning.create({
      data,
    });
  }

  static async update(id: number, data: any) {
    return prisma.planning.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return prisma.planning.delete({
      where: { id },
    });
  }

  static async getForecasts() {
    // Logic to calculate completion forecasts based on productivity and remaining quantities
    const services = await prisma.service.findMany({
      where: { remainingQuantity: { gt: 0 } },
      include: { environment: true },
    });

    // Simplified forecast logic
    return services.map(s => ({
      serviceId: s.id,
      name: s.name,
      environment: s.environment?.name || 'Independente',
      remaining: s.remainingQuantity,
      estimatedDays: Math.ceil(s.remainingQuantity / 10), // Placeholder for real productivity logic
    }));
  }
}
