# Solicitação de reembolso na denúncia

Cliente e diarista participantes podem marcar **Solicitar análise de reembolso** ao denunciar uma diária. A opção fica desmarcada por padrão. Nos dois casos, o pedido refere-se aos valores pagos pelo cliente, não a uma transferência para a diarista, e segue para análise do administrador.

A API exige vínculo com uma diária do perfil autenticado, denunciado igual à contraparte e pagamentos aprovados ainda não estornados nem já na fila de estorno. O valor líquido é calculado no banco e guardado apenas como referência na solicitação; o cliente não informa valores, status ou decisão. O bloqueio da diária durante a criação impede pedidos simultâneos duplicados. Outro pedido pendente, em análise ou aprovado para a mesma diária impede nova solicitação; uma denúncia sem reembolso continua permitida.

Na Central de denúncias, o administrador vê o destaque, a diária, o valor pago no momento da solicitação, a descrição e os anexos. O filtro **Somente pedidos de reembolso** permite consultar esses registros. A análise pode manter o pedido em análise, aprovar ou negar a solicitação. Para concluir a denúncia é preciso decidir sobre o reembolso; arquivar exige negar. A decisão, justificativa e administrador ficam no histórico. O usuário comum não pode alterar esses campos.

**Nenhuma dessas ações executa estorno, chama o Mercado Pago ou marca um pagamento como devolvido.** Aprovar aqui é uma decisão administrativa, não uma confirmação de devolução. O processamento financeiro continua separado e deve conferir o estado atual da cobrança antes de qualquer operação. As regras e filas de estorno automático existentes não foram alteradas.

Instalação aditiva no banco legado: `node scripts/install-report-refunds.mjs --apply`, regenerar Prisma com o backend parado brevemente no Windows, registrar `20261117030000_denuncia_reembolso` como aplicada após conferir a estrutura e reiniciar. Sem `--apply`, o instalador apenas verifica. Nenhuma denúncia real foi criada e nenhum pagamento foi alterado para instalar ou testar a estrutura.

Testes: `test/reportRefunds.test.js`, `scripts/test-two-way-reviews.cjs` e `scripts/test-admin-reports.cjs`. Os novos campos e o filtro estão documentados no Swagger.
