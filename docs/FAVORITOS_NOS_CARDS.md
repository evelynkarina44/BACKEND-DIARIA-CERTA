# Favoritos nos cards de Minhas diárias

Os cards do cliente permitem favoritar/desfavoritar a diarista. Os cards da diarista permitem favoritar/desfavoritar o cliente da diária. O botão é um coração com alvo de toque de 44 px, rótulo acessível, estado selecionado e indicação de envio. Cliques repetidos para a mesma pessoa são bloqueados enquanto a alteração é enviada.

Todos os cards repetidos da mesma pessoa são atualizados após recarregar a lista persistida, sem alterar filtros, ordem, página ou o ID da diária usado para pagamento/check-in. Todas as páginas de favoritos são carregadas para reconhecer preferências além dos primeiros cem registros. Falhas mostram a modal padrão e uma falha de leitura impede alterar um estado desconhecido até atualizar.

As preferências são independentes por direção e perfil:

- Cliente → diarista: tabela e endpoints existentes de `/api/favorito`, sem alterar os registros antigos. A profissional aparece também na tela Favoritos já existente.
- Diarista → cliente: nova tabela `favorito_cliente`, endpoints `/api/favorito/clientes` e `/api/favorito/clientes/:id`, exclusivos de diaristas. Repetir o cadastro usa a mesma preferência. Somente clientes com diária vinculada à diarista podem ser favoritados; não se permite favoritar a própria conta nem criar uma preferência para conta indisponível. A consulta retorna apenas nome/foto do cliente, sem dados de contato, nascimento, CPF ou endereço.

IDs são específicos de cada recurso. Rotas e permissões separadas evitam interpretar um ID antigo de favorito do cliente como ID de favorito da diarista após uma troca de perfil. GET/DELETE verificam o proprietário; uma diarista não acessa nem remove favoritos de outra.

O escopo desta atualização é o coração nos cards. Não foi criada uma nova página de clientes favoritos nem mudado o menu da diarista.

Instalação aditiva no banco legado: `node scripts/install-worker-favorites.mjs --apply`, regenerar o Prisma com reinício breve do backend no Windows e registrar `20261117040000_clientes_favoritos` como aplicada após conferir a tabela. Sem `--apply`, apenas verifica. Nenhum favorito real é criado ou removido pelo instalador.

Testes: `test/workerFavorites.test.js`, `scripts/test-daily-card-favorites.cjs` e regressões de histórico/favoritos. A validação usa dados simulados; nenhum cliente ou diarista real foi favoritado para testar.
