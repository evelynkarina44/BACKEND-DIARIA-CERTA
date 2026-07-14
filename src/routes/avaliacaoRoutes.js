import { express } from 'express';
import { AvaliacaoController } from '../controllers/AvaliacaoController';

export const router = express.Router();

const avaliacaoController = new AvaliacaoController();

router.get('/', avaliacaoController.listarAvaliacao);

router.get('/:id', avaliacaoController.buscarAvaliacaoPorId);

router.post('/', avaliacaoController.criarAvaliacao);

router.put('/:id', avaliacaoController.atualizarAvaliacao);

router.delete('/:id', avaliacaoController.deletarAvaliacao);

