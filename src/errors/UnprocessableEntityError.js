import { AppError } from "./AppError.js";

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity") {
    super(message, 422);
  }
}

// Saldo insuficiente
// Pedido já finalizado