import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
    constructor(message = "Bad request", details = null) {
        super(message, 400, details);
    }
}

//exemplos de uso:
// JSON mal formatado
// Parâmetro obrigatório ausente
// Query string inválida