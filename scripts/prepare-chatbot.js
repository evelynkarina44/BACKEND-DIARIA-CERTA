// APRESENTACAO | APOIO PESSOA 2 — Teste de recuperação: npm run chatbot:prepare.
// Mostrar fontes, scores e dimensões; não chama o Gemini nem mede acurácia global.
// Executar antes da apresentação: o primeiro uso pode baixar os pesos do modelo local.
import 'dotenv/config';
import { ragService, normalizedDotProduct } from '../src/services/chatbot/RagService.js';
import { EmbeddingService } from '../src/services/chatbot/EmbeddingService.js';

try {
  const started = Date.now();
  const index = await ragService.prepare();
  console.log(JSON.stringify({ chunks: index.chunks.length, dimensoes: index.vectors[0]?.length, tempo_ms: Date.now() - started }));
  for (const query of ['Como funciona o aceite da diarista?', 'Posso incluir serviços fora do combo?', 'A distância é uma rota de trânsito?']) {
    const results = await ragService.retrieve(query);
    const [vector] = await new EmbeddingService().encode([query]);
    const ranked = index.chunks.map((chunk, i) => ({ fonte: chunk.fonte, score: Number(normalizedDotProduct(index.vectors[i], vector).toFixed(4)) })).sort((a, b) => b.score - a.score).slice(0, 3);
    console.log(JSON.stringify({ pergunta: query, resultados: results.map(({ fonte, score }) => ({ fonte, score: Number(score.toFixed(4)) })), melhores_pontuacoes: ranked }));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
