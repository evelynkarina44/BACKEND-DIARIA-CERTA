export class AppError extends Error {
    constructor(message, statusCode = 400, code = "APPLICATION_ERROR", details = null) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
