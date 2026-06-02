import { ValidationError } from "../errors";

export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if(!result.success) {
            return next(
                new ValidationError(
                    "Validation failed",
                    result.error.flatten()
                )
            );
        }

        req.validatedData = result.data;

        next();
    };
}