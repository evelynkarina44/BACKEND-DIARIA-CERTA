import { ValidationError } from "../errors/ValidationError.js";

export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if(!result.success) {
            return next(
                new ValidationError(
                    "Dados da requisição inválidos.",
                    result.error.flatten()
                )
            );
        }

        req.validated = result.data;
        if (result.data.body !== undefined) req.body = result.data.body;
        if (result.data.params !== undefined) req.params = result.data.params;

        next();
    };
}
