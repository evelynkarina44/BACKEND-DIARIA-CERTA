import prisma from '../../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import { coordinatesByCep, calculateDistanceKm } from '../location/CepGeocodingService.js';

// Coordenadas de CEP são aproximações, não a posição exata da casa nem uma rota.
export class AppointmentLocationService {
  constructor(database = prisma, geocode = coordinatesByCep) {
    this.database = database;
    this.geocode = geocode;
  }

  async coordinates(cep) {
    if (!cep) return null;
    try { return await this.geocode(cep); } catch { return null; }
  }

  async describe(appointments, workerId) {
    if (!appointments.length) return [];
    const address = await this.database.endereco.findFirst({
      where: { id_diarista: workerId }, orderBy: { id_endereco: 'asc' }, select: { cep: true },
    });
    const origin = await this.coordinates(address?.cep);
    return Promise.all(appointments.map(async appointment => {
      const destination = await this.coordinates(appointment.endereco?.cep);
      const distance = origin && destination ? calculateDistanceKm(origin, destination) : null;
      return {
        distancia_km: Number.isFinite(distance) ? Number(distance.toFixed(2)) : null,
        ponto_destino: destination,
        precisao: 'cep',
      };
    }));
  }

  async find(id, auth) {
    if (!auth?.id_diarista || auth.activeProfile !== 'DIARISTA') throw new ForbiddenError('Entre como diarista para visualizar o local da diária.');
    const appointment = await this.database.agendamento.findUnique({
      where: { id_agendamento: Number(id) },
      select: { id_agendamento: true, id_diarista: true, endereco: { select: { cep: true } } },
    });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (appointment.id_diarista !== auth.id_diarista) throw new ForbiddenError('Agendamento não pertence à diarista autenticada');
    return (await this.describe([appointment], auth.id_diarista))[0];
  }
}
