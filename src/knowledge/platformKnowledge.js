// EVELYN | ETAPA 1 — Base documental: mostrar id, titulo e texto.
// Conteúdo editorial: somente regras verificadas no backend, nunca dados de profissionais.
// Preços, combos e agenda atuais são consultados no banco, não fixados nestes documentos.
export const platformKnowledge = [
  { id: 'solicitacao', titulo: 'Solicitação e aceite', texto: 'Confirmar uma solicitação cria um agendamento com status Pendente. A diarista precisa aceitar ou recusar. Enviar a solicitação não significa que a diária foi aceita. Solicitações pendentes possuem prazo de resposta de 48 horas e podem expirar.' },
  { id: 'servicos', titulo: 'Serviços individuais', texto: 'Cada diarista cadastra os serviços que oferece e o preço de cada um. O pedido precisa incluir serviços oferecidos pela profissional escolhida. Os nomes e preços atuais devem ser consultados no cadastro. Se um serviço não estiver disponível, o assistente deve pedir esclarecimento e não inventar uma oferta.' },
  { id: 'combos', titulo: 'Combos e serviços extras', texto: 'O combo reúne serviços por um valor base. Ele precisa ser compatível com o tamanho da residência. A quantidade de cômodos é informativa e não bloqueia a contratação da diarista nem a escolha do combo. Todos os serviços do combo devem estar incluídos no pedido. Serviços extras fora do combo somam seus preços individuais ao valor base. O cliente deve revisar o combo antes de confirmar.' },
  { id: 'endereco', titulo: 'Endereço e residência', texto: 'Para solicitar uma diária, o cliente precisa ter endereço cadastrado. O endereço utilizado deve pertencer ao cliente autenticado. O tamanho da casa e a quantidade de cômodos são obtidos do perfil de cliente. Quando existem vários endereços, o cliente deve escolher qual será usado.' },
  { id: 'localizacao', titulo: 'Proximidade das diaristas', texto: 'A plataforma calcula distância geográfica aproximada a partir de coordenadas do CEP. Essa distância não é uma rota de trânsito e não informa tempo de deslocamento. Uma localização desconhecida não permite afirmar que uma diarista é a mais próxima. Os dados de localização devem ser consultados no sistema.' },
  { id: 'agenda', titulo: 'Datas e horários', texto: 'A diarista cadastra datas e horários em sua agenda. Uma solicitação precisa ser futura e utilizar um horário cadastrado. Agendamentos aceitos ou em andamento não podem ter intervalos conflitantes. Um horário de início não informa, por si só, a duração real da faxina. A disponibilidade deve ser consultada novamente antes da confirmação.' },
  { id: 'cancelamento', titulo: 'Cancelar proposta ou agendamento', texto: 'Cancelar uma proposta do assistente antes de confirmar não cria um agendamento. Depois do envio, cliente ou diarista participante pode cancelar um agendamento Pendente ou Aceito pelo fluxo de agendamento. Cancelar uma conversa não cancela automaticamente uma solicitação já enviada.' },
  { id: 'perfis', titulo: 'Perfis de cliente e diarista', texto: 'Uma conta pode possuir perfil de cliente, de diarista ou ambos. Para solicitar uma diária é necessário estar com o perfil de cliente ativo. Não é permitido contratar o próprio perfil de diarista. Trocar o perfil ativo altera as operações disponíveis na sessão.' },
];

// APOIO EVELYN | ETAPA 6 — Exemplos associados às fontes auxiliam a busca semântica.
// Perguntas editoriais recuperam os mesmos documentos; não constituem novas regras.
const questions = {
  solicitacao: ['Como funciona o aceite da diarista?', 'Quem confirma a minha diária?', 'Quanto tempo a diarista tem para responder?', 'O que significa Pendente?'],
  servicos: ['Quais serviços a diarista oferece?', 'Como escolher os serviços de limpeza?'],
  combos: ['Posso incluir serviços fora do combo?', 'Como funciona o combo base?', 'Como é calculado o preço dos serviços extras?'],
  endereco: ['Preciso cadastrar meu endereço?', 'Como escolher o endereço da diária?'],
  localizacao: ['A distância é uma rota de trânsito?', 'Como encontro a diarista mais próxima?'],
  agenda: ['Como funciona a disponibilidade?', 'Qual é a duração da faxina?', 'Posso agendar para um horário ocupado?'],
  cancelamento: ['Como cancelar uma proposta?', 'Cancelar a conversa cancela meu agendamento?'],
  perfis: ['Posso ser cliente e diarista?', 'Como trocar meu perfil ativo?'],
};
for (const document of platformKnowledge) document.perguntas = questions[document.id] || [];
