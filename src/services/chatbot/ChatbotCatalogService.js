// EVELYN | ETAPA 2 — Consulta de diarista: fonte de verdade é o cadastro atual.
// Exemplo: "Rafael Sá tem combos?"; não colocar preços ou profissionais fixos no corpus do RAG.
import prisma from '../../lib/prisma.js';
import { DiaristaSearchService } from '../diarista/DiaristaSearchService.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Dados públicos atuais: não entram no índice editorial nem dependem de geração do modelo.
export class ChatbotCatalogService {
  constructor(database = prisma) { this.search = new DiaristaSearchService(database); }

  // Mostrar catalogProfiles() e a resposta montada com os registros; não cria propostas nem agendamentos.
  async answer({ nome, assunto }, referenceId) {
    const empty = (texto) => ({ texto, fontes: [], diarista_consultada: null });
    if (!nome && !referenceId) return empty('De qual diarista você quer consultar essas informações? Informe o nome completo.');
    const profiles = await this.search.catalogProfiles(nome ? { nome } : { id: referenceId });
    if (!profiles.length) return empty(nome ? `Não encontrei uma diarista ativa com o nome “${nome}”. Confira o nome no perfil e tente novamente.` : 'Essa diarista não está mais disponível para consulta. Informe o nome de outra profissional.');
    if (profiles.length > 1) {
      const names = profiles.slice(0, 5).map((profile) => `${profile.usuario.nome}${profile.endereco[0] ? ` (${profile.endereco[0].cidade}/${profile.endereco[0].estado})` : ''}`);
      return empty(`Encontrei mais de uma diarista com esse nome: ${names.join('; ')}${profiles.length > 5 ? '; entre outras' : ''}. Informe o nome completo. Se os nomes forem iguais, confira os perfis na busca manual; não vou escolher uma pessoa por você.`);
    }
    const [profile] = profiles;
    const name = profile.usuario.nome;
    const lines = [];
    if (assunto === 'perfil') {
      lines.push(name, profile.descricao || 'Sem descrição cadastrada.');
      if (profile.avaliacao_media != null) lines.push(`Avaliação média: ${Number(profile.avaliacao_media).toFixed(1)}.`);
    }
    if (assunto === 'combos' || assunto === 'perfil') {
      if (!profile.combo_base.length) lines.push(`${name} não possui combos ativos cadastrados no momento.`);
      else {
        lines.push(`Combos ativos de ${name}:`);
        const offered = new Set(profile.diarista_servico.map((service) => service.id_servico));
        for (const combo of profile.combo_base) {
          const sizes = [['pequena', 'Pequena'], ['media', 'Média'], ['grande', 'Grande']].filter(([key]) => combo[`atende_casa_${key}`]).map(([, label]) => label);
          lines.push(`• ${combo.nome_combo} — ${money.format(Number(combo.valor_base))}`);
          if (combo.descricao) lines.push(combo.descricao);
          lines.push(`Serviços incluídos: ${combo.combo_servico.map((item) => item.servico.nome_servico).join(', ') || 'nenhum cadastrado'}.`);
          if (sizes.length) lines.push(`Residências: ${sizes.join(', ')}.`);
          if (combo.combo_servico.some((item) => !offered.has(item.id_servico))) lines.push('Atenção: este combo inclui serviço que não está ativo na oferta da profissional; a contratação precisa ser validada.');
        }
      }
    }
    if (assunto === 'servicos' || assunto === 'perfil') {
      if (!profile.diarista_servico.length) lines.push(`${name} não possui serviços ativos cadastrados no momento.`);
      else {
        lines.push(`Serviços ativos de ${name}:`);
        for (const item of profile.diarista_servico) {
          lines.push(`• ${item.servico.nome_servico} — ${money.format(Number(item.preco))}`);
          if (item.servico.descricao) lines.push(item.servico.descricao);
        }
      }
    }
    lines.push('Esses são os dados atuais do cadastro. A disponibilidade de data e horário é verificada separadamente antes de enviar uma solicitação.');
    return {
      texto: lines.join('\n'),
      fontes: [{ id: `diarista:${profile.id_diarista}:${assunto}`, titulo: `Cadastro de ${name} — ${assunto}` }],
      diarista_consultada: profile.id_diarista,
    };
  }
}
