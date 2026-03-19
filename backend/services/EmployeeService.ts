import prisma from '../config/database';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths } from 'date-fns';

export class EmployeeService {
  static async getAll(query: any) {
    const { sortBy, sortOrder, page = 1, limit = 20, search } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' },
        skip,
        take,
      }),
      prisma.employee.count({ where })
    ]);

    return {
      data: employees,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }

  static async getNextCode() {
    const employees = await prisma.employee.findMany({
      select: { code: true }
    });

    const codes = employees
      .map(e => parseInt(e.code || '0'))
      .filter(c => !isNaN(c));

    const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
    return (maxCode + 1).toString().padStart(4, '0');
  }

  static async terminate(id: number, resignationDate: string) {
    return prisma.employee.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        resignationDate
      }
    });
  }

  static async importEmployees(input: any) {
    const data = Array.isArray(input) ? input : (input.employees || []);
    const results = [];
    for (const row of data) {
      // Map Excel headers to database fields
      const mappedData: any = {
        code: row['Código'] || row['code'],
        name: row['Nome'] || row['name'],
        role: row['Função'] || row['role'],
        document: row['Documento'] || row['document'],
        phone: row['Telefone'] || row['phone'],
        isRegistered: (row['Registrado'] === 'Sim' || row['isRegistered'] === 1) ? 1 : 0,
        baseSalary: parseFloat(row['Salário Base'] || row['baseSalary'] || 0),
        bankName: row['Banco'] || row['bankName'],
        bankAgency: row['Agência'] || row['bankAgency'],
        bankOperation: row['Operação'] || row['bankOperation'],
        bankAccount: row['Conta'] || row['bankAccount'],
        bankObservations: row['Observações Bancárias'] || row['bankObservations'],
        status: 'Ativo'
      };

      // Handle date format
      let admissionDate = row['Data Admissão'] || row['admissionDate'];
      
      if (admissionDate) {
        if (typeof admissionDate === 'number') {
          // Excel numeric date (days since 1900-01-01)
          const date = new Date((admissionDate - 25569) * 86400 * 1000);
          admissionDate = date.toISOString().split('T')[0];
        } else if (typeof admissionDate === 'string') {
          if (admissionDate.includes('/')) {
            const [day, month, year] = admissionDate.split('/');
            admissionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else if (admissionDate.includes('-')) {
            // Already in YYYY-MM-DD or similar
            admissionDate = admissionDate.split('T')[0];
          }
        }
      }
      
      mappedData.admissionDate = admissionDate;

      if (!mappedData.name) continue; // Skip empty rows

      const employee = await prisma.employee.create({
        data: mappedData
      });
      results.push(employee);
    }
    return { count: results.length, employees: results };
  }
}
