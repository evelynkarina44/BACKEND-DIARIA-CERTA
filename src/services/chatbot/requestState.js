import { BadRequestError } from '../../errors/index.js';

export function localToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function resolveRequestDate(extraction, now = new Date()) {
  let value = extraction.data;
  if (extraction.dias_a_partir_de_hoje !== null && extraction.dias_a_partir_de_hoje !== undefined) {
    const date = new Date(`${localToday(now)}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + extraction.dias_a_partir_de_hoje);
    value = date.toISOString().slice(0, 10);
  }
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestError('Informe uma data válida.');
  const max = new Date(`${localToday(now)}T00:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 365);
  if (value < localToday(now) || value > max.toISOString().slice(0, 10)) throw new BadRequestError('Escolha uma data futura dentro dos próximos 12 meses.');
  return value;
}

export function mergeRequestState(previous, extraction, selection = {}, now) {
  const state = extraction.limpar_pedido ? {} : { ...previous };
  delete state.opcoes;
  const date = resolveRequestDate(extraction, now);
  if (date) state.data = date;
  if (extraction.horario) state.horario = extraction.horario;
  if (extraction.servicos !== null && extraction.servicos !== undefined) {
    state.servicos = [...new Set(extraction.servicos)];
    delete state.id_combo_base;
  }
  if (extraction.servicos_nao_encontrados?.length) state.nao_encontrados = extraction.servicos_nao_encontrados;
  else if (extraction.servicos !== null || selection.id_servico) delete state.nao_encontrados;
  if (selection.id_servico) {
    state.servicos = [...new Set([...(state.servicos || []), selection.id_servico])];
    delete state.nao_encontrados;
  }
  if (selection.id_endereco) state.id_endereco = selection.id_endereco;
  if ('id_combo_base' in selection) state.id_combo_base = selection.id_combo_base;
  return state;
}
