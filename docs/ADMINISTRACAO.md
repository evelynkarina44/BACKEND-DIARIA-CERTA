# Administração de denúncias

O perfil ADMIN é uma permissão separada (`usuario.administrador`), concedida apenas por operação local. Não existe cadastro público nem endpoint para promover usuários. A API consulta essa permissão no banco a cada requisição; revogar a permissão invalida o acesso administrativo mesmo com um token anterior.

## Instalação

Em banco novo, a migration `20261117000000_admin_denuncias` adiciona os campos e o histórico. Em banco legado com divergência no histórico de migrations, execute somente `node scripts/install-admin.mjs --apply`, gere o Prisma e marque essa migration como aplicada. Não execute migrations antigas em lote nem reset do banco.

Para promover uma conta existente: `node scripts/provision-admin.mjs --email=admin@gmail.com --grant`. A senha será preservada.

Para criar uma nova conta: `node scripts/provision-admin.mjs --email=admin@gmail.com --create --generate-password`. Guarde a senha exibida uma única vez em um gerenciador de senhas. Alternativamente, forneça `ADMIN_INITIAL_PASSWORD` no ambiente local (mínimo 16 caracteres), sem a opção `--generate-password`. Nenhuma senha é fixa no código ou na documentação. Use senha exclusiva; o painel não disponibiliza recuperação ou troca de senha administrativa nesta versão.

## Uso

Entre pelo login normal. Contas apenas administrativas abrem Denúncias diretamente; contas com múltiplos perfis escolhem Administração. O painel funciona na web e no aplicativo, com busca, filtro por status, dez denúncias por página e detalhamento do denunciante/denunciado.

- Pendente: denúncia nova, ainda editável pelo autor.
- Em análise: recebida pela administração.
- Resolvida: decisão registrada.
- Arquivada: análise encerrada sem prosseguir.

Cada análise exige observação e registra administrador, data, status e justificativa. Duas alterações simultâneas não sobrescrevem decisões silenciosamente. Análises já registradas não possuem endpoint de edição/exclusão. Denúncias em análise não podem ser editadas ou excluídas pelo denunciante. As observações administrativas não são devolvidas pelas rotas comuns de denúncias.

O menu administrativo possui apenas **Central de denúncias** e **Tabela de usuários**. A tabela é somente de consulta: total global, busca por nome/e-mail/número, dez registros por página, perfil e situação da conta.

Na central, o moderador lê a descrição e as imagens e registra uma decisão manual: **Nenhuma medida**, **Suspender por 1 a 365 dias** ou **Excluir conta**. Só denúncias concluídas como Resolvida podem aplicar medidas; Arquivada não aplica sanção. Uma decisão final não pode ser repetida. Contas administrativas e o próprio moderador não podem ser alvo de sanção pelo painel.

Suspender registra a data de término; a liberação é automática após esse instante. Excluir é uma exclusão lógica: encerra permanentemente o acesso e retira a conta das buscas, preservando vínculos de diárias, pagamentos e provas. Ambas invalidam as sessões antigas por versão do token. Nenhuma medida cancela diárias ou altera pagamentos automaticamente. Se houver diárias abertas, saldo de diária concluída sem pagamento ou estorno pendente, a medida é rejeitada para análise manual prévia.

Denúncias aceitam até três anexos: fotos JPG/PNG/WebP de até 5 MB ou vídeos MP4 H.264 de até 10 MB e 60 segundos. Fotos são reencodadas sem metadados e vídeos preservam o arquivo original. Não existe URL pública; somente denunciante e administrador podem ler os anexos autenticados. O upload pode ser retomado após falha sem recriar a denúncia na mesma tela. Veja [os formatos, limites e a instalação da extensão de mídias](ANEXOS_AVALIACOES_DENUNCIAS.md).

Instalação adicional em banco legado: `node scripts/install-admin-measures.mjs --apply`, gerar Prisma e marcar `20261117010000_admin_medidas_anexos` como aplicada, sem executar migrations antigas em lote. Nenhum usuário é suspenso ou excluído pelo instalador.

## API restrita

- `GET /api/admin/denuncias?page=1&limit=10&status=EmAnalise&busca=nome`
- `GET /api/admin/denuncias/:id`
- `GET /api/admin/usuarios?page=1&limit=10&busca=nome`
- `POST /api/admin/denuncias/:id/analises`: `{ "status": "Resolvida", "observacao": "Justificativa", "versao": 0, "acao": "Suspender", "dias_suspensao": 7 }`

Todas exigem token com perfil ativo ADMIN e permissão atual no banco, retornam `Cache-Control: no-store` e não selecionam senha, CPF, telefone ou endereço residencial. A busca administrativa deve ser usada somente para moderação.
