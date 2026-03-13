import prisma from '../config/database';

export class EnvironmentService {
  static async getAll() {
    return prisma.environment.findMany({
      include: {
        sector: true,
        floor: true,
        doors: true,
        windows: true,
        electricalPoints: true,
        sanitaryPoints: true,
        hydraulicPoints: true,
        envServices: {
          include: { service: true }
        }
      }
    });
  }

  static async getFlowchartData() {
    const sectors = await prisma.sector.findMany({
      include: {
        floors: {
          include: {
            environments: true
          }
        }
      }
    });

    // Transform to tree structure for React Flow if needed, 
    // but usually better to send raw and transform on frontend
    return sectors;
  }

  static async create(data: any) {
    const { 
      portas, janelas, pontos_eletricos, pontos_sanitarios, pontos_hidraulicos, services,
      tem_portas, tem_janelas, tem_pontos_eletricos, tem_pontos_sanitarios, tem_pontos_hidraulicos,
      area_total, area_teto, area_parede,
      setor_id, pavimento_id,
      ...envData 
    } = data;

    return prisma.environment.create({
      data: {
        ...envData,
        totalArea: parseFloat(area_total) || 0,
        ceilingArea: parseFloat(area_teto) || 0,
        wallArea: parseFloat(area_parede) || 0,
        sectorId: Number(setor_id),
        floorId: Number(pavimento_id),
        hasDoors: !!tem_portas,
        hasWindows: !!tem_janelas,
        hasElectricalPoints: !!tem_pontos_eletricos,
        hasSanitaryPoints: !!tem_pontos_sanitarios,
        hasHydraulicPoints: !!tem_pontos_hidraulicos,
        doors: portas ? { create: portas.map((p: any) => ({ ...p, width: parseFloat(p.width), height: parseFloat(p.height), quantity: parseInt(p.quantity) })) } : undefined,
        windows: janelas ? { create: janelas.map((w: any) => ({ ...w, width: parseFloat(w.width), height: parseFloat(w.height), sillHeight: parseFloat(w.peitoril), quantity: parseInt(w.quantity) })) } : undefined,
        electricalPoints: pontos_eletricos ? { create: pontos_eletricos.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        sanitaryPoints: pontos_sanitarios ? { create: pontos_sanitarios.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        hydraulicPoints: pontos_hidraulicos ? { create: pontos_hidraulicos.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        envServices: services ? {
          create: services.map((sId: number) => ({ serviceId: sId }))
        } : undefined
      }
    });
  }

  static async update(id: number, data: any) {
    const { 
      portas, janelas, pontos_eletricos, pontos_sanitarios, pontos_hidraulicos, services,
      tem_portas, tem_janelas, tem_pontos_eletricos, tem_pontos_sanitarios, tem_pontos_hidraulicos,
      area_total, area_teto, area_parede,
      setor_id, pavimento_id,
      ...envData 
    } = data;

    // Delete existing sub-records first for simplicity in update (or use upsert)
    await Promise.all([
      prisma.door.deleteMany({ where: { environmentId: id } }),
      prisma.window.deleteMany({ where: { environmentId: id } }),
      prisma.electricalPoint.deleteMany({ where: { environmentId: id } }),
      prisma.sanitaryPoint.deleteMany({ where: { environmentId: id } }),
      prisma.hydraulicPoint.deleteMany({ where: { environmentId: id } }),
      prisma.environmentService.deleteMany({ where: { environmentId: id } })
    ]);

    return prisma.environment.update({
      where: { id },
      data: {
        ...envData,
        totalArea: parseFloat(area_total) || 0,
        ceilingArea: parseFloat(area_teto) || 0,
        wallArea: parseFloat(area_parede) || 0,
        sectorId: Number(setor_id),
        floorId: Number(pavimento_id),
        hasDoors: !!tem_portas,
        hasWindows: !!tem_janelas,
        hasElectricalPoints: !!tem_pontos_eletricos,
        hasSanitaryPoints: !!tem_pontos_sanitarios,
        hasHydraulicPoints: !!tem_pontos_hidraulicos,
        doors: portas ? { create: portas.map((p: any) => ({ ...p, width: parseFloat(p.width), height: parseFloat(p.height), quantity: parseInt(p.quantity) })) } : undefined,
        windows: janelas ? { create: janelas.map((w: any) => ({ ...w, width: parseFloat(w.width), height: parseFloat(w.height), sillHeight: parseFloat(w.peitoril), quantity: parseInt(w.quantity) })) } : undefined,
        electricalPoints: pontos_eletricos ? { create: pontos_eletricos.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        sanitaryPoints: pontos_sanitarios ? { create: pontos_sanitarios.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        hydraulicPoints: pontos_hidraulicos ? { create: pontos_hidraulicos.map((p: any) => ({ ...p, quantity: parseInt(p.quantity) })) } : undefined,
        envServices: services ? {
          create: services.map((sId: number) => ({ serviceId: sId }))
        } : undefined
      }
    });
  }
}
