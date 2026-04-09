import prisma from '../config/database.ts';

export class DiaryService {
  static async getEntries(filters: any) {
    return prisma.constructionDiary.findMany({
      where: filters,
      include: {
        workers: true,
        activities: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  static async createEntry(data: any) {
    const { workers, activities, ...diaryData } = data;
    
    return prisma.constructionDiary.create({
      data: {
        ...diaryData,
        workers: {
          create: workers
        },
        activities: {
          create: activities.map((id: number) => ({ activityId: id }))
        }
      },
      include: {
        workers: true,
        activities: true
      }
    });
  }

  static async getEntryByDate(date: string) {
    return prisma.constructionDiary.findUnique({
      where: { date },
      include: {
        workers: true,
        activities: true
      }
    });
  }
}
