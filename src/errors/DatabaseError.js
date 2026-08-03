import { AppError } from "./AppError.js";

export class DatabaseError extends AppError {
  constructor(message = "Database error", details = null) {
    super(message, 500, details);
  }
}

// Muito útil para encapsular erros do ORM.