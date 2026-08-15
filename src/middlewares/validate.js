import { ValidationError } from "../errors/index.js";

export function validate(schema, source = "body") {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);

        if(!result.success) {
            return next(
                new ValidationError(
                    "Validation failed",
                    result.error.flatten()
                )
            );
        }

        if (source === "query") {
            Object.defineProperty(req, "query", {
                value: result.data,
                writable: true,
                configurable: true,
                enumerable: true,
            });
        } else {
            req[source] = result.data;
        }

        next();
    };
}
