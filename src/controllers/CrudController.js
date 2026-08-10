import { NotFoundError } from '../errors/NotFoundError.js';

export class CrudController {
  constructor({ services, methods, idParam = 'id', resourceName }) {
    const listService = new services.list();
    const findService = new services.find();
    const createService = new services.create();
    const updateService = new services.update();
    const deleteService = new services.delete();

    this[methods.list] = async (req, res) => {
      const result = await listService.execute(req.query, req.auth);
      return res.status(200).json(result);
    };
    this[methods.find] = async (req, res) => {
      const result = await findService.execute(req.params[idParam], req.auth);
      if (!result) throw new NotFoundError(`${resourceName} não encontrado`);
      return res.status(200).json(result);
    };
    this[methods.create] = async (req, res) => {
      const result = await createService.execute(req.body, req.auth);
      return res.status(201).json(result);
    };
    this[methods.update] = async (req, res) => {
      const result = await updateService.execute(req.params[idParam], req.body, req.auth);
      return res.status(200).json(result);
    };
    this[methods.delete] = async (req, res) => {
      await deleteService.execute(req.params[idParam], req.auth);
      return res.status(204).send();
    };
  }
}
