import prisma from '../config/database';

export class MaterialService {
  static async calculateRequirements() {
    const activities = await prisma.activity.findMany({
      include: {
        compositions: true,
        executions: true,
      }
    });

    // Calculate total materials based on service quantities and compositions
    const requirements: any = {};

    const services = await prisma.service.findMany();
    
    for (const service of services) {
      // Find activity that matches this service (simplified logic)
      const activity = await prisma.activity.findFirst({
        where: { name: service.name }
      });

      if (activity) {
        const compositions = await prisma.composition.findMany({
          where: { activityId: activity.id, type: 'Material' }
        });

        for (const comp of compositions) {
          const totalNeeded = service.totalQuantity * comp.quantity;
          requirements[comp.description] = (requirements[comp.description] || 0) + totalNeeded;
        }
      }
    }

    return Object.entries(requirements).map(([name, quantity]) => ({
      name,
      quantity,
      unit: 'un' // Should be from composition
    }));
  }
}
