# Fotos e vídeos nas avaliações e denúncias

Clientes e diaristas podem selecionar até **3 anexos no total por registro**. Fotos JPG/PNG/WebP de até 5 MB são reencodadas em JPEG, com tamanho máximo de 2048 px e sem metadados. Vídeos devem ser MP4 não fragmentado, H.264 (áudio AAC opcional), de até 10 MB, 60 segundos e 4096 px por dimensão. Vídeos não são transcodificados; MOV, HEVC, WebM e outros formatos devem ser convertidos antes do envio. A API inspeciona os bytes e a estrutura do contêiner, não apenas a extensão ou o MIME enviado.

- Avaliações: o autor anexa. A visualização segue a visibilidade **atual** da avaliação; as privadas são acessíveis somente aos participantes. As mídias aparecem nas avaliações recebidas e nas avaliações públicas do perfil da diarista.
- Denúncias: o autor anexa enquanto o status é Pendente. Somente ele e o administrador podem abrir os anexos; o denunciado não pode. A central administrativa abre fotos e vídeos sob demanda.
- Os arquivos ficam no banco (`MEDIUMBLOB`), nunca no diretório público de fotos de perfil. As listagens carregam apenas metadados. O endpoint de leitura retorna um data URI, sem cache, e o player exige ação do usuário, sem autoplay. Vídeos preservam o arquivo original e podem conter metadados de captura.
- O corpo binário usa `application/octet-stream`, em rotas específicas, sem aumentar o limite global de JSON. O banco deve aceitar pacotes maiores que 10 MB (`max_allowed_packet`).
- O cabeçalho opcional `X-Anexo-Id` permite repetir o upload sem duplicar o arquivo. A contagem é protegida pela transação/bloqueio do registro pai. As chaves são únicas dentro de cada registro.
- A tela só mostra sucesso depois de concluir todos os uploads. Uma falha permite retomar os arquivos restantes na mesma tela sem recriar a avaliação/denúncia. Arquivos pendentes recusados podem ser removidos ou substituídos; arquivos já enviados não são removidos por essa tela.

## Instalação aditiva em ambientes com histórico legado

1. Aplicar `node scripts/install-review-media.mjs --apply` (sem `--apply`, apenas verifica).
2. Parar brevemente o backend se o Windows estiver usando a DLL do Prisma; executar `npx prisma generate`.
3. Registrar `npx prisma migrate resolve --applied 20261117020000_avaliacao_denuncia_midias` após conferir a estrutura, e reiniciar o backend.

A migração não altera avaliações existentes nem as notas/médias. Anexos antigos de denúncias recebem `tipo=image` e `mime=image/jpeg`. Em bancos novos com histórico íntegro, a migração SQL pode ser aplicada pelo fluxo habitual de migrações. Não usar reset no banco legado.

Os contratos das quatro operações de anexos estão no Swagger. Testes: `test/reviewMedia.test.js` no backend e `scripts/test-media-attachments.cjs`, `scripts/test-two-way-reviews.cjs` e `scripts/test-admin-reports.cjs` no frontend. O player mobile usa o WebView já presente no aplicativo; o envio local usa a versão de `expo-file-system` correspondente ao SDK instalado.
