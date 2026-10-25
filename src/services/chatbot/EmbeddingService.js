// PEDRO | ETAPA 3 — Modelo local de embeddings, separado do Gemini.
// Modelo pré-treinado: vetores de 384 dimensões; a execução não treina novos pesos.
import { resolve } from 'node:path';
import { ServiceUnavailableError } from '../../errors/index.js';

let extractorPromise;
// Mostrar pipeline, nome do MiniLM, q8 e cache. Após baixar os pesos, a inferência é local.
async function extractor() {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers').then(async ({ pipeline, env }) => {
      env.cacheDir = resolve(process.env.CHATBOT_MODEL_CACHE_DIR || '.cache/chatbot-models');
      return pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { dtype: 'q8' });
    }).catch(() => {
      extractorPromise = undefined;
      throw new ServiceUnavailableError('Não foi possível carregar a busca semântica. Tente novamente em instantes.');
    });
  }
  return extractorPromise;
}

export class EmbeddingService {
  // APOIO EVELYN | ETAPA 2 — Contar tokens para ajustar os chunks antes de codificá-los.
  async tokenCount(text) {
    const model = await extractor();
    const encoded = await model.tokenizer(text, { truncation: false });
    return encoded.input_ids.data.length;
  }

  // PEDRO| ETAPA 3; EVELYN | ETAPAS 3 E 4 — Texto para vetor.
  // Destacar mean pooling, normalização e limite de 128 tokens. Não chama a API do Gemini.
  async encode(texts) {
    try {
      const model = await extractor();
      const output = await model(texts, { pooling: 'mean', normalize: true, truncation: true, max_length: 128 });
      return output.tolist();
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error;
      throw new ServiceUnavailableError('A busca semântica está indisponível. Tente novamente.');
    }
  }
}
