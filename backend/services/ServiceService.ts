import prisma from '../config/database';

export class ServiceService {
  static async getAll() {
    return prisma.service.findMany({
      include: {
        environment: true,
        envServices: {
          include: { environment: true }
        }
      }
    });
  }

  static async create(data: any) {
    return prisma.service.create({
      data
    });
  }

  static async update(id: number, data: any) {
    return prisma.service.update({
      where: { id },
      data
    });
  }

  static async delete(id: number) {
    return prisma.service.delete({
      where: { id }
    });
  }
}
