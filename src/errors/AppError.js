export class AppError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
