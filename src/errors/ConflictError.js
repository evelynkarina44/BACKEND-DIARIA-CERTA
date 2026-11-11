import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details = null) {
    super(message, 409, details);
  }
}

// Email já cadastrado
// CPF já existente
