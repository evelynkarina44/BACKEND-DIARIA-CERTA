import { AppError } from "./AppError.js";

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable") {
    super(message, 503);
  }
}

// Banco fora do ar