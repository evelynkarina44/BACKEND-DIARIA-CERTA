import { express } from 'express';
import { DenunciaController } from '../controllers/denunciaController';

const router = express.Router();

const denunciaController = new DenunciaController();

router.get('/', denunciaController.listarDenuncias);

router.get('/:id', denunciaController.buscarDenunciaPorId);

router.post('/', denunciaController.criarDenuncia);

router.put('/:id', denunciaController.atualizarDenuncia);

router.delete('/:id', denunciaController.deletarDenuncia);