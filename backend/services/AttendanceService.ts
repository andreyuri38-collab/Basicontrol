import prisma from '../config/database.ts';
import { addDays, format, parseISO } from 'date-fns';

export class AttendanceService {
  static async registerMedicalCertificate(data: any) {
    const { employeeId, type, startDate, days, description } = data;
    const daysAway = days || 1;
    const certType = type || 'Atestado Médico';
    
    const start = parseISO(startDate);
    const returnDate = format(addDays(start, daysAway), 'yyyy-MM-dd');

    // 1. Create the certificate record
    const certificate = await prisma.medicalCertificate.create({
      data: {
        employeeId,
        type: certType,
        startDate,
        daysAway,
        returnDate
      }
    });

    // 2. Auto-fill attendance for the period
    const attendancePromises = [];
    for (let i = 0; i < daysAway; i++) {
      const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
      
      // Check if already exists to update or create
      const existing = await prisma.frequency.findFirst({
        where: {
          employeeId,
          date: currentDate
        }
      });

      if (existing) {
        attendancePromises.push(
          prisma.frequency.update({
            where: { id: existing.id },
            data: { 
              status: 'ATESTADO',
              observations: description || certType,
              atestatoDays: daysAway - i // Remaining days
            }
          })
        );
      } else {
        attendancePromises.push(
          prisma.frequency.create({
            data: {
              employeeId,
              date: currentDate,
              status: 'ATESTADO',
              observations: description || certType,
              atestatoDays: daysAway - i
            }
          })
        );
      }
    }

    await Promise.all(attendancePromises);
    return certificate;
  }

  static async getAttendanceList(month: string) {
    // month format: YYYY-MM
    const employees = await prisma.employee.findMany({
      include: {
        frequencies: {
          where: {
            date: {
              startsWith: month
            }
          }
        }
      }
    });

    // Filter out terminated employees from previous months
    const filteredEmployees = employees.filter(emp => {
      if (emp.status !== 'TERMINATED') return true;
      if (!emp.resignationDate) return true;
      
      const resignationMonth = emp.resignationDate.substring(0, 7);
      return resignationMonth === month;
    });

    return filteredEmployees;
  }
}
