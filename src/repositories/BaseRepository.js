export class BaseRepository {
  constructor(model, idField) {
    this.model = model;
    this.idField = idField;
  }

  findAll(options = {}) {
    return this.model.findMany(options);
  }

  findById(id, options = {}) {
    return this.model.findUnique({
      ...options,
      where: { [this.idField]: Number(id) },
    });
  }

  findFirst(options = {}) {
    return this.model.findFirst(options);
  }

  count(where = {}) {
    return this.model.count({ where });
  }

  create(data, options = {}) {
    return this.model.create({ data, ...options });
  }

  update(id, data, options = {}) {
    return this.model.update({
      where: { [this.idField]: Number(id) },
      data,
      ...options,
    });
  }

  delete(id, options = {}) {
    return this.model.delete({
      where: { [this.idField]: Number(id) },
      ...options,
    });
  }
}
