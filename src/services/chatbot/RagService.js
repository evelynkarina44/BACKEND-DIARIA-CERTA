// EVELYN | ETAPAS 2 A 7 — Núcleo do RAG: chunks, índice e recuperação.
// Ordem para navegar: createChunks -> prepare -> retrieve -> normalizedDotProduct -> filtros.
import { platformKnowledge } from '../../knowledge/platformKnowledge.js';
import { EmbeddingService } from './EmbeddingService.js';

// EVELYN | ETAPA 2 — Chunking: 450 caracteres e 60 de sobreposição iniciais.
// Cada trecho mantém sua fonte e posição; prepare() pode reduzir o tamanho por limite de tokens.
export function createChunks(documents, size = 450, overlap = 60) {
  if (size <= overlap || overlap < 0) throw new Error('Configuração de chunks inválida');
  return documents.flatMap((document) => {
    const text = `${document.titulo}: ${document.texto}`.replace(/\s+/g, ' ').trim();
    const chunks = [];
    for (let start = 0; start < text.length;) {
      const end = Math.min(start + size, text.length);
      // Destacar o ID documento:posição e a parada no fim; overlap preserva parte do contexto.
      chunks.push({ id: `${document.id}:${start}`, fonte: document.id, titulo: document.titulo, texto: text.slice(start, end) });
      if (end === text.length) break;
      start = end - overlap;
    }
    return chunks;
  });
}

// EVELYN | ETAPA 5 — Com vetores normalizados, produto escalar = cosseno.
// O resultado mede relação semântica, não a certeza de que uma resposta está correta.
export function normalizedDotProduct(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

export class RagService {
  constructor(embedding = new EmbeddingService(), documents = platformKnowledge) {
    this.embedding = embedding;
    this.documents = documents;
  }

  // EVELYN | ETAPA 3 — Preparar e manter o índice vetorial em memória.
  // Faz inferência com modelo pré-treinado; não realiza fine-tuning nem treina o Gemini.
  async prepare() {
    if (!this.indexPromise) {
      this.indexPromise = (async () => {
        // Respeita tanto os parâmetros do NYLEVE quanto o limite real do tokenizer.
        const chunks = [];
        for (const document of this.documents) {
          let size = 450;
          let pieces;
          while (true) {
            pieces = createChunks([document], size, Math.min(60, Math.floor(size / 4)));
            // APOIO | ETAPA 2 — Caracteres não são tokens: reduzir se ultrapassar 128 tokens.
            const counts = await Promise.all(pieces.map((piece) => this.embedding.tokenCount(piece.texto)));
            if (counts.every((count) => count <= 128)) break;
            if (size <= 80) throw new Error('Documento excede o limite de tokens');
            size = Math.floor(size * 0.75);
          }
          chunks.push(...pieces);
        }
        // ETAPA 3 — Codificar chunks e exemplos de perguntas com o mesmo modelo de embeddings.
        const questions = this.documents.flatMap((document) => (document.perguntas || []).map((texto) => ({ fonte: document.id, texto })));
        const vectors = await this.embedding.encode([...chunks.map((chunk) => chunk.texto), ...questions.map((question) => question.texto)]);
        return { chunks, vectors: vectors.slice(0, chunks.length), questions: questions.map((question, index) => ({ ...question, vector: vectors[chunks.length + index] })) };
      })().catch((error) => { this.indexPromise = undefined; throw error; });
    }
    return this.indexPromise;
  }

  // EVELYN | ETAPA 4 — A pergunta entra no mesmo espaço vetorial da base.
  async retrieve(query, topK = 3) {
    const { chunks, vectors, questions } = await this.prepare();
    const [question] = await this.embedding.encode([query.slice(-1800)]);
    // EVELYN | ETAPA 6 — Limiar 0.35 e até 3 fontes; não significa 35% de certeza.
    const threshold = Number(process.env.CHATBOT_RAG_MIN_SCORE ?? 0.35);
    const questionScores = new Map();
    // A pontuação também considera perguntas editoriais, com fator 0.9, combinadas pelo máximo.
    for (const item of questions) {
      questionScores.set(item.fonte, Math.max(questionScores.get(item.fonte) || 0, normalizedDotProduct(item.vector, question) * 0.9));
    }
    // ETAPA 6 — Filtrar, ordenar e evitar repetir fontes. Pode retornar menos de 3 ou nenhum trecho.
    // ETAPA 7 — O retorno é o contexto recuperado; continuar em ChatbotService.message().
    const seen = new Set();
    return chunks.map((chunk, index) => ({ ...chunk, score: Math.max(normalizedDotProduct(vectors[index], question), questionScores.get(chunk.fonte) || 0) }))
      .filter((chunk) => chunk.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .filter((chunk) => { if (seen.has(chunk.fonte)) return false; seen.add(chunk.fonte); return true; }).slice(0, topK);
  }
}

export const ragService = new RagService();
