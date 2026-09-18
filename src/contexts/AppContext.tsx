import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirebaseConnection } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Work,
  Frente,
  Employee,
  Equipment,
  Schedule,
  ProductivityLog,
  FinancialEntry,
  CompanySettings,
  FrenteStats,
} from '../types';

interface AppContextType {
  works: Work[];
  frentes: Frente[];
  employees: Employee[];
  equipments: Equipment[];
  schedules: Schedule[];
  productivityLogs: ProductivityLog[];
  financialEntries: FinancialEntry[];
  settings: CompanySettings;
  frenteStatsList: FrenteStats[];
  loading: boolean;
  selectedWorkId: string;
  setSelectedWorkId: (id: string) => void;
  // CRUD Methods
  createWork: (work: Omit<Work, 'id' | 'createdAt'>) => Promise<string>;
  updateWork: (id: string, updates: Partial<Work>) => Promise<void>;
  deleteWork: (id: string) => Promise<void>;
  createFrente: (frente: Omit<Frente, 'id' | 'createdAt'>) => Promise<string>;
  updateFrente: (id: string, updates: Partial<Frente>) => Promise<void>;
  deleteFrente: (id: string) => Promise<void>;
  createEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Promise<string>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  createEquipment: (eq: Omit<Equipment, 'id' | 'createdAt'>) => Promise<string>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  createSchedule: (sch: Omit<Schedule, 'id' | 'createdAt'>) => Promise<string>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  createProductivityLog: (log: Omit<ProductivityLog, 'id' | 'createdAt'>) => Promise<string>;
  updateProductivityLog: (id: string, updates: Partial<ProductivityLog>) => Promise<void>;
  deleteProductivityLog: (id: string) => Promise<void>;
  createFinancialEntry: (entry: Omit<FinancialEntry, 'id' | 'createdAt'>) => Promise<string>;
  updateFinancialEntry: (id: string, updates: Partial<FinancialEntry>) => Promise<void>;
  deleteFinancialEntry: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<void>;
  seedInitialData: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
  id: 'company',
  defaultProductivityM2PerDay: 350,
  jobRoles: ['Engenheiro', 'Encarregado', 'Aplicador', 'Auxiliar'],
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile, isAdmin } = useAuth();

  const [works, setWorks] = useState<Work[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [productivityLogs, setProductivityLogs] = useState<ProductivityLog[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [selectedWorkId, setSelectedWorkId] = useState<string>('all');

  // Boot connection check
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) {
      setWorks([]);
      setFrentes([]);
      setEmployees([]);
      setEquipments([]);
      setSchedules([]);
      setProductivityLogs([]);
      setFinancialEntries([]);
      setLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];

    // 1. Works
    const worksQuery = query(collection(db, 'works'), orderBy('name', 'asc'));
    unsubs.push(
      onSnapshot(
        worksQuery,
        (snap) => {
          const list: Work[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Work));
          setWorks(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'works')
      )
    );

    // 2. Frentes
    const frentesQuery = query(collection(db, 'frentes'), orderBy('name', 'asc'));
    unsubs.push(
      onSnapshot(
        frentesQuery,
        (snap) => {
          const list: Frente[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Frente));
          setFrentes(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'frentes')
      )
    );

    // 3. Employees
    const empQuery = query(collection(db, 'employees'), orderBy('name', 'asc'));
    unsubs.push(
      onSnapshot(
        empQuery,
        (snap) => {
          const list: Employee[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Employee));
          setEmployees(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'employees')
      )
    );

    // 3.1 Equipments (Próprios, Locados, Bombeamento)
    const eqQuery = query(collection(db, 'equipments'), orderBy('name', 'asc'));
    unsubs.push(
      onSnapshot(
        eqQuery,
        (snap) => {
          const list: Equipment[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Equipment));
          setEquipments(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'equipments')
      )
    );

    // 4. Schedules
    const schQuery = query(collection(db, 'schedules'), orderBy('date', 'desc'));
    unsubs.push(
      onSnapshot(
        schQuery,
        (snap) => {
          const list: Schedule[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Schedule));
          setSchedules(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'schedules')
      )
    );

    // 5. Productivity Logs
    const prodQuery = query(collection(db, 'productivity'), orderBy('date', 'desc'));
    unsubs.push(
      onSnapshot(
        prodQuery,
        (snap) => {
          const list: ProductivityLog[] = [];
          snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ProductivityLog));
          setProductivityLogs(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'productivity')
      )
    );

    // 6. Financial (Only subscribed if Admin)
    if (isAdmin) {
      const finQuery = query(collection(db, 'financial'), orderBy('dueDate', 'asc'));
      unsubs.push(
        onSnapshot(
          finQuery,
          (snap) => {
            const list: FinancialEntry[] = [];
            snap.forEach((d) => {
              const item = { ...d.data(), id: d.id } as FinancialEntry;
              // Check overdue status automatically
              const todayStr = new Date().toISOString().split('T')[0];
              if (item.status === 'pendente' && item.dueDate < todayStr) {
                item.status = 'atrasado';
              }
              list.push(item);
            });
            setFinancialEntries(list);
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'financial')
        )
      );
    } else {
      setFinancialEntries([]);
    }

    // 7. Settings
    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'company'),
        (snap) => {
          if (snap.exists()) {
            setSettings(snap.data() as CompanySettings);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'settings/company')
      )
    );

    setLoading(false);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser, isAdmin]);

  // Productivity and Schedule statistics per frente
  const frenteStatsList = useMemo(() => {
    // If user is Campo, filter to frentes they are assigned to (or all if none specified)
    let visibleFrentes = frentes;
    if (profile && profile.role === 'campo' && profile.assignedFrenteIds && profile.assignedFrenteIds.length > 0) {
      visibleFrentes = frentes.filter((f) => profile.assignedFrenteIds?.includes(f.id));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return visibleFrentes.map((frente): FrenteStats => {
      const parentWork = works.find((w) => w.id === frente.workId);
      const logs = productivityLogs.filter((p) => p.frenteId === frente.id);

      const totalExecutedM2 = logs.reduce((sum, l) => sum + (Number(l.m2Executed) || 0), 0);
      const areaTotal = frente.areaM2 || 1;
      const remainingM2 = Math.max(0, areaTotal - totalExecutedM2);
      const completionPercent = Math.min(100, Math.round((totalExecutedM2 / areaTotal) * 100));

      const daysWithWork = logs.length;
      // Calculate real productivity average: use the last 5 logs or total days
      const recentLogs = logs.slice(0, 7);
      const recentM2 = recentLogs.reduce((sum, l) => sum + (Number(l.m2Executed) || 0), 0);
      const avgProductivityM2PerDay =
        recentLogs.length > 0
          ? Math.round(recentM2 / recentLogs.length)
          : frente.targetProductivityM2PerDay || settings.defaultProductivityM2PerDay || 350;

      // Estimated remaining days
      let estimatedDaysNeeded = 0;
      if (remainingM2 > 0 && avgProductivityM2PerDay > 0) {
        estimatedDaysNeeded = Math.ceil(remainingM2 / avgProductivityM2PerDay);
      }

      let estimatedCompletionDate: string | null = null;
      if (remainingM2 === 0) {
        estimatedCompletionDate = logs[0]?.date || frente.endDate;
      } else {
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + estimatedDaysNeeded);
        estimatedCompletionDate = estDate.toISOString().split('T')[0];
      }

      // Check delay against original end date
      const originalEnd = new Date(frente.endDate + 'T00:00:00');
      const estimatedEnd = estimatedCompletionDate ? new Date(estimatedCompletionDate + 'T00:00:00') : originalEnd;

      const isDelayed = estimatedEnd > originalEnd && remainingM2 > 0;
      const isBehindRhythm = avgProductivityM2PerDay < frente.targetProductivityM2PerDay && remainingM2 > 0;
      const diffTime = estimatedEnd.getTime() - originalEnd.getTime();
      const delayDays = isDelayed ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

      return {
        frente,
        work: parentWork,
        totalExecutedM2,
        remainingM2,
        completionPercent,
        daysWithWork,
        avgProductivityM2PerDay,
        estimatedCompletionDate,
        originalEndDate: frente.endDate,
        isDelayed,
        isBehindRhythm,
        delayDays,
      };
    });
  }, [frentes, works, productivityLogs, profile, settings]);

  // CRUD Implementations
  const createWork = async (workData: Omit<Work, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'work_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newWork: Work = {
      ...workData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.uid,
    };
    try {
      await setDoc(doc(db, 'works', id), newWork);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `works/${id}`);
      return id;
    }
  };

  const updateWork = async (id: string, updates: Partial<Work>) => {
    try {
      await updateDoc(doc(db, 'works', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `works/${id}`);
    }
  };

  const deleteWork = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'works', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `works/${id}`);
    }
  };

  const createFrente = async (frenteData: Omit<Frente, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'frente_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newFrente: Frente = {
      ...frenteData,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'frentes', id), newFrente);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `frentes/${id}`);
      return id;
    }
  };

  const updateFrente = async (id: string, updates: Partial<Frente>) => {
    try {
      await updateDoc(doc(db, 'frentes', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `frentes/${id}`);
    }
  };

  const deleteFrente = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'frentes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `frentes/${id}`);
    }
  };

  const createEmployee = async (empData: Omit<Employee, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEmp: Employee = {
      ...empData,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'employees', id), newEmp);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `employees/${id}`);
      return id;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
    }
  };

  const createEquipment = async (eqData: Omit<Equipment, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'eq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEq: Equipment = {
      ...eqData,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'equipments', id), newEq);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `equipments/${id}`);
      return id;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      await updateDoc(doc(db, 'equipments', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `equipments/${id}`);
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'equipments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `equipments/${id}`);
    }
  };

  const createSchedule = async (schData: Omit<Schedule, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'sch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newSch: Schedule = {
      ...schData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.uid,
    };
    try {
      await setDoc(doc(db, 'schedules', id), newSch);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schedules/${id}`);
      return id;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      await updateDoc(doc(db, 'schedules', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `schedules/${id}`);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`);
    }
  };

  const createProductivityLog = async (logData: Omit<ProductivityLog, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newLog: ProductivityLog = {
      ...logData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.uid,
    };
    try {
      await setDoc(doc(db, 'productivity', id), newLog);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `productivity/${id}`);
      return id;
    }
  };

  const updateProductivityLog = async (id: string, updates: Partial<ProductivityLog>) => {
    try {
      await updateDoc(doc(db, 'productivity', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `productivity/${id}`);
    }
  };

  const deleteProductivityLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'productivity', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `productivity/${id}`);
    }
  };

  const createFinancialEntry = async (finData: Omit<FinancialEntry, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'fin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newFin: FinancialEntry = {
      ...finData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.uid,
    };
    try {
      await setDoc(doc(db, 'financial', id), newFin);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `financial/${id}`);
      return id;
    }
  };

  const updateFinancialEntry = async (id: string, updates: Partial<FinancialEntry>) => {
    try {
      await updateDoc(doc(db, 'financial', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `financial/${id}`);
    }
  };

  const deleteFinancialEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'financial', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `financial/${id}`);
    }
  };

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    const merged = { ...settings, ...updates, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'settings', 'company'), merged, { merge: true });
      setSettings(merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/company');
    }
  };

  // Realistic seed data for contrapiso autonivelante management
  const seedInitialData = async () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const dMinus10 = new Date(today); dMinus10.setDate(today.getDate() - 10);
    const dMinus5 = new Date(today); dMinus5.setDate(today.getDate() - 5);
    const dPlus15 = new Date(today); dPlus15.setDate(today.getDate() + 15);
    const dPlus25 = new Date(today); dPlus25.setDate(today.getDate() + 25);
    const dPlus5 = new Date(today); dPlus5.setDate(today.getDate() + 5);

    // 1. Obra Principal
    const work1Id = await createWork({
      name: 'Residencial Reserva dos Ipês',
      clientName: 'Cyrela Construtora e Incorporadora',
      clientPhone: '(11) 98765-4321',
      clientEmail: 'eng.alberto@cyrela.com.br',
      address: 'Av. Paulista, 2100 - Bela Vista, São Paulo - SP',
      totalAreaM2: 5400,
      contractValue: 243000,
      startDate: formatDate(dMinus10),
      endDate: formatDate(dPlus25),
      status: 'em_andamento',
      notes: 'Aplicação de contrapiso autonivelante bombeado com espessura média de 4 cm sobre manta acústica.',
    });

    const work2Id = await createWork({
      name: 'Edifício Horizon Corporate',
      clientName: 'Even Construtora',
      clientPhone: '(11) 97123-8899',
      clientEmail: 'obras@even.com.br',
      address: 'Rua Funchal, 418 - Vila Olímpia, São Paulo - SP',
      totalAreaM2: 3200,
      contractValue: 156800,
      startDate: formatDate(dMinus5),
      endDate: formatDate(dPlus15),
      status: 'em_andamento',
      notes: 'Lajes corporativas de alta planicidade para piso vinílico e carpete em placas.',
    });

    // 2. Frentes de trabalho da Obra 1
    const frente1Id = await createFrente({
      workId: work1Id,
      name: 'Torre A - Pavimentos 1 ao 6',
      areaM2: 1800,
      targetProductivityM2PerDay: 350,
      startDate: formatDate(dMinus10),
      endDate: formatDate(dPlus5),
      status: 'em_andamento',
    });

    const frente2Id = await createFrente({
      workId: work1Id,
      name: 'Torre A - Pavimentos 7 ao 12',
      areaM2: 1800,
      targetProductivityM2PerDay: 350,
      startDate: formatDate(dPlus5),
      endDate: formatDate(dPlus25),
      status: 'nao_iniciada',
    });

    const frente3Id = await createFrente({
      workId: work2Id,
      name: 'Torre Única - Pavimentos 1 ao 4',
      areaM2: 1600,
      targetProductivityM2PerDay: 400,
      startDate: formatDate(dMinus5),
      endDate: formatDate(dPlus15),
      status: 'em_andamento',
    });

    // 3. Funcionários
    const emp1Id = await createEmployee({
      name: 'Carlos Alberto Silva',
      role: 'Encarregado',
      phone: '(11) 99881-2233',
      hireDate: '2023-03-15',
      status: 'ativo',
      assignedFrenteIds: [frente1Id, frente2Id],
      accessEmail: 'campo.nivelar@obras.com',
    });

    const emp2Id = await createEmployee({
      name: 'Rogério de Souza',
      role: 'Aplicador',
      phone: '(11) 98711-4455',
      hireDate: '2023-06-10',
      status: 'ativo',
      assignedFrenteIds: [frente1Id, frente3Id],
    });

    const emp3Id = await createEmployee({
      name: 'Antônio Marcos Ferreira',
      role: 'Aplicador',
      phone: '(11) 97655-6677',
      hireDate: '2023-08-01',
      status: 'ativo',
      assignedFrenteIds: [frente1Id, frente2Id],
    });

    const emp4Id = await createEmployee({
      name: 'Luciano Pereira',
      role: 'Auxiliar',
      phone: '(11) 99122-3344',
      hireDate: '2024-01-20',
      status: 'ativo',
      assignedFrenteIds: [frente1Id, frente3Id],
    });

    // 3.1 Equipamentos de Bombeamento e Apoio
    const eq1Id = await createEquipment({
      name: 'Bomba de Projeção Putzmeister P13',
      code: 'BP-01',
      category: 'bombeamento',
      ownership: 'proprio',
      status: 'em_uso',
      notes: 'Bomba de argamassa e autonivelante de pistão, pressão máx 40 bar.',
    });

    const eq2Id = await createEquipment({
      name: 'Bomba Misturadora Turbomix TM-200',
      code: 'BP-02',
      category: 'bombeamento',
      ownership: 'proprio',
      status: 'disponivel',
      notes: 'Misturador contínuo com bomba acoplada para silos ou sacos.',
    });

    const eq3Id = await createEquipment({
      name: 'Caminhão Bomba Lança 32m (Terceirizado)',
      code: 'TERC-01',
      category: 'bombeamento',
      ownership: 'terceirizado',
      status: 'disponivel',
      supplierOrRentalCompany: 'MaxiBombas Concreto & Argamassa',
      costResponsibilityDefault: 'contratante',
      rentalDailyCost: 3200,
      notes: 'Operador e mangotes inclusos pelo fornecedor. Custo repassado à construtora contratante.',
    });

    await createEquipment({
      name: 'Nível Laser Rotativo Bosch GRL 300 HV',
      code: 'LAS-01',
      category: 'laser_nivel',
      ownership: 'proprio',
      status: 'em_uso',
      notes: 'Tripé e receptor de precisão milimétrica.',
    });

    await createEquipment({
      name: 'Gerador Silenciado 55 kVA (Locado)',
      code: 'LOC-01',
      category: 'gerador',
      ownership: 'locado',
      status: 'disponivel',
      supplierOrRentalCompany: 'LocaMáquinas Brasil',
      rentalDailyCost: 380,
      notes: 'Contrato de locação mensal com manutenção inclusa.',
    });

    // 4. Apontamentos de Produtividade (Histórico da Frente 1)
    const d1 = new Date(today); d1.setDate(today.getDate() - 4);
    const d2 = new Date(today); d2.setDate(today.getDate() - 3);
    const d3 = new Date(today); d3.setDate(today.getDate() - 2);
    const d4 = new Date(today); d4.setDate(today.getDate() - 1);

    await createProductivityLog({
      workId: work1Id,
      frenteId: frente1Id,
      date: formatDate(d1),
      m2Executed: 360,
      presentEmployeeIds: [emp1Id, emp2Id, emp3Id, emp4Id],
      notes: 'Aplicação no 1º e 2º pavimento concluída com sucesso. Bomba operou com pressão ideal.',
    });

    await createProductivityLog({
      workId: work1Id,
      frenteId: frente1Id,
      date: formatDate(d2),
      m2Executed: 380,
      presentEmployeeIds: [emp1Id, emp2Id, emp3Id, emp4Id],
      notes: 'Aplicação no 3º pavimento. Nivelamento a laser checado, desvio < 2mm.',
    });

    await createProductivityLog({
      workId: work1Id,
      frenteId: frente1Id,
      date: formatDate(d3),
      m2Executed: 340,
      presentEmployeeIds: [emp1Id, emp2Id, emp3Id],
      notes: 'Aplicação no 4º pavimento. Chuva no final do dia mas áreas internas protegidas.',
    });

    await createProductivityLog({
      workId: work1Id,
      frenteId: frente1Id,
      date: formatDate(d4),
      m2Executed: 390,
      presentEmployeeIds: [emp1Id, emp2Id, emp3Id, emp4Id],
      notes: 'Aplicação no 5º pavimento. Rendimento excelente da argamassa autonivelante.',
    });

    // 5. Programação do Dia e Semana
    await createSchedule({
      date: formatDate(today),
      workId: work1Id,
      frenteId: frente1Id,
      activity: 'Aplicação de Autonivelante (6º Pavimento)',
      assignedEmployeeIds: [emp1Id, emp2Id, emp3Id, emp4Id],
      pumpingEquipmentType: 'proprio',
      pumpingEquipmentId: eq1Id,
      notes: 'Início do bombeamento às 08:00. Bomba própria Putzmeister P13 alocada.',
    });

    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    await createSchedule({
      date: formatDate(tomorrow),
      workId: work1Id,
      frenteId: frente1Id,
      activity: 'Cura e Desmolde de Niveladores',
      assignedEmployeeIds: [emp1Id, emp4Id],
      pumpingEquipmentType: 'nenhum',
      notes: 'Liberação para tráfego leve em 24h.',
    });

    await createSchedule({
      date: formatDate(tomorrow),
      workId: work2Id,
      frenteId: frente3Id,
      activity: 'Aplicação com Caminhão Bomba Terceirizado',
      assignedEmployeeIds: [emp2Id, emp3Id],
      pumpingEquipmentType: 'terceirizado',
      pumpingEquipmentId: eq3Id,
      pumpingCostResponsibility: 'contratante',
      pumpingSupplier: 'MaxiBombas Concreto & Argamassa',
      pumpingCost: 3200,
      notes: 'Custo do bombeamento faturado diretamente para a construtora contratante.',
    });

    // 6. Financeiro (A Receber e A Pagar)
    const finDue1 = new Date(today); finDue1.setDate(today.getDate() + 7);
    const finDue2 = new Date(today); finDue2.setDate(today.getDate() + 18);
    const finDuePast = new Date(today); finDuePast.setDate(today.getDate() - 3);

    await createFinancialEntry({
      type: 'receber',
      workId: work1Id,
      category: 'Medição',
      description: '1ª Medição Torre A (1.470 m² executados)',
      amount: 66150,
      dueDate: formatDate(finDue1),
      status: 'pendente',
      partyName: 'Cyrela Construtora',
    });

    await createFinancialEntry({
      type: 'receber',
      workId: work2Id,
      category: 'Medição',
      description: 'Sinal e Mobilização de Equipamentos',
      amount: 47040,
      dueDate: formatDate(finDuePast),
      paymentDate: formatDate(finDuePast),
      status: 'recebido',
      partyName: 'Even Construtora',
    });

    await createFinancialEntry({
      type: 'receber',
      workId: work1Id,
      category: 'Medição',
      description: '2ª Medição Programada',
      amount: 55000,
      dueDate: formatDate(finDue2),
      status: 'pendente',
      partyName: 'Cyrela Construtora',
    });

    // A Pagar
    const payDue1 = new Date(today); payDue1.setDate(today.getDate() + 3);
    const payDue2 = new Date(today); payDue2.setDate(today.getDate() + 10);
    const payDuePast = new Date(today); payDuePast.setDate(today.getDate() - 2);

    await createFinancialEntry({
      type: 'pagar',
      workId: work1Id,
      category: 'Material',
      description: 'Carga de Argamassa Autonivelante Bombeada (40 ton)',
      amount: 22800,
      dueDate: formatDate(payDue1),
      status: 'pendente',
      partyName: 'Votorantim Cimentos / Argamassa',
    });

    await createFinancialEntry({
      type: 'pagar',
      workId: work1Id,
      category: 'Diária',
      description: 'Diárias Equipe de Aplicação (Semana 37)',
      amount: 7400,
      dueDate: formatDate(payDuePast),
      status: 'atrasado',
      partyName: 'Equipe Campo Silva & Cia',
    });

    await createFinancialEntry({
      type: 'pagar',
      category: 'Salário',
      description: 'Folha de Pagamento Equipe Operacional',
      amount: 14500,
      dueDate: formatDate(payDue2),
      status: 'pendente',
      partyName: 'Folha Geral',
    });
  };

  return (
    <AppContext.Provider
      value={{
        works,
        frentes,
        employees,
        equipments,
        schedules,
        productivityLogs,
        financialEntries,
        settings,
        frenteStatsList,
        loading,
        selectedWorkId,
        setSelectedWorkId,
        createWork,
        updateWork,
        deleteWork,
        createFrente,
        updateFrente,
        deleteFrente,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        createEquipment,
        updateEquipment,
        deleteEquipment,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        createProductivityLog,
        updateProductivityLog,
        deleteProductivityLog,
        createFinancialEntry,
        updateFinancialEntry,
        deleteFinancialEntry,
        updateSettings,
        seedInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
