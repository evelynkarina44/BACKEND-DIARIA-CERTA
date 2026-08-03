import { AppError } from "./AppError.js";

export class ExternalServiceError extends AppError {
  constructor(message = "External service error", details = null) {
    super(message, 502, details);
  }
}

// Stripe indisponível
// Gateway de pagamento falhou
// API dos Correios retornou erro