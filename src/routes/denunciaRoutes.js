import { Router } from 'express';
import { attachmentUpload } from '../middlewares/attachmentUpload.js';
import { z } from 'zod';
import { DenunciaAttachmentService } from '../services/denuncia/DenunciaAttachmentService.js';
import { DenunciaController } from '../controllers/denunciaController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createDenunciaSchema, idSchema, listQuerySchema, updateDenunciaSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new DenunciaController();

router.use(authenticate);
router.post('/:id/anexos', validate(idSchema,'params'), ...attachmentUpload, async(req,res)=>res.status(201).json(await new DenunciaAttachmentService().upload(req.params.id,req.body,req.auth,req.get('X-Anexo-Id'))));
router.get('/:id/anexos/:anexo', validate(z.object({id:z.coerce.number().int().positive(),anexo:z.string().uuid()}),'params'), async(req,res)=>{res.set('Cache-Control','no-store');res.set('Vary','Authorization');return res.json(await new DenunciaAttachmentService().read(req.params.id,req.params.anexo,req.auth));});
router.get('/', validate(listQuerySchema, 'query'), controller.listarDenuncias);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDenunciaPorId);
router.post('/', validate(createDenunciaSchema), controller.criarDenuncia);
router.put('/:id', validate(idSchema, 'params'), validate(updateDenunciaSchema), controller.atualizarDenuncia);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarDenuncia);

export default router;
