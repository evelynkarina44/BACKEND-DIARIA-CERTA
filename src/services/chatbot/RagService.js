// EVELYN | ETAPAS 2 A 7 — Núcleo do RAG: chunks, índice e recuperação.
// Ordem para navegar: prepare -> buildIndex -> createDocumentChunks -> createChunks.
// Na consulta: retrieve -> normalizedDotProduct -> filtros de pontuação e fonte.
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
      this.indexPromise = this.buildIndex().catch((error) => {
        // Uma falha não deve impedir uma nova tentativa de preparar o índice.
        this.indexPromise = undefined;
        throw error;
      });
    }
    return this.indexPromise;
  }

  async createDocumentChunks(document) {
    let size = 450;
    while (true) {
      const overlap = Math.min(60, Math.floor(size / 4));
      const chunks = createChunks([document], size, overlap);
      // APOIO | ETAPA 2 — Caracteres não são tokens: reduzir se ultrapassar 128 tokens.
      const counts = await Promise.all(chunks.map((chunk) => this.embedding.tokenCount(chunk.texto)));
      if (counts.every((count) => count <= 128)) return chunks;
      if (size <= 80) throw new Error('Documento excede o limite de tokens');
      size = Math.floor(size * 0.75);
    }
  }

  async buildIndex() {
    const chunks = [];
    const questions = [];
    for (const document of this.documents) {
      chunks.push(...await this.createDocumentChunks(document));
      for (const texto of document.perguntas || []) {
        questions.push({ fonte: document.id, texto });
      }
    }

    // ETAPA 3 — Codificar chunks e exemplos de perguntas com o mesmo modelo de embeddings.
    const texts = [...chunks.map((chunk) => chunk.texto), ...questions.map((question) => question.texto)];
    const vectors = await this.embedding.encode(texts);
    return {
      chunks,
      vectors: vectors.slice(0, chunks.length),
      questions: questions.map((question, index) => ({
        ...question,
        vector: vectors[chunks.length + index],
      })),
    };
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
      const previousScore = questionScores.get(item.fonte) || 0;
      const exampleScore = normalizedDotProduct(item.vector, question) * 0.9;
      questionScores.set(item.fonte, Math.max(previousScore, exampleScore));
    }
    const ranked = chunks.map((chunk, index) => {
      const textScore = normalizedDotProduct(vectors[index], question);
      const exampleScore = questionScores.get(chunk.fonte) || 0;
      return { ...chunk, score: Math.max(textScore, exampleScore) };
    }).filter((chunk) => chunk.score >= threshold)
      .sort((a, b) => b.score - a.score);

    // ETAPA 6 — Filtrar, ordenar e evitar repetir fontes. Pode retornar menos de 3 ou nenhum trecho.
    // ETAPA 7 — O retorno é o contexto recuperado; continuar em ChatbotService.message().
    const seen = new Set();
    const uniqueSources = ranked.filter((chunk) => {
      if (seen.has(chunk.fonte)) return false;
      seen.add(chunk.fonte);
      return true;
    });
    return uniqueSources.slice(0, topK);
  }
}

export const ragService = new RagService();
