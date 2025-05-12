export interface MapperOptions<I> {
    fieldValidation: Partial<{[key in keyof I]: (value: unknown) => boolean}>;
    fieldConverter: Partial<{[key in keyof I]: (value: unknown) => unknown}>;
}

export abstract class Mapper<I = {}> {

    #fieldValidation: Partial<{[key in keyof I]: (value: unknown) => boolean}> = {};
    #fieldConverter: Partial<{[key in keyof I]: (value: unknown) => unknown}> = {};

    public constructor({fieldValidation, fieldConverter,}: MapperOptions<I>) {
        this.#fieldValidation = fieldValidation;
        this.#fieldConverter = fieldConverter;
    }

    public fromObject(object: Record<string, unknown>): I {
        throw new Error("Method not implemented.");
    }

    public mapAndValidate(object: Record<string, unknown>): I {

        if (this === undefined) {
            throw new Error("Mapper instance is undefined. Did you use destructuring 'const {fromObject} = Mapper.create()'? \n If true use 'const mapper = Mapper.create()' instead.");
        }

        const initials = {} as I;

        for (const key in object) {

            const validation = this.#fieldValidation[key];
            
            if (!validation) {
                throw new Error(`Validation not found for key: ${key}`);
            }

            const converter = this.#fieldConverter[key];
            
            if (!converter) {
                throw new Error(`Converter not found for key: ${key}`);
            }

            initials[key] = converter(object[key]);
            const isValid = validation(initials[key]);

            if (!isValid) {
                throw new Error(`Invalid value for ${key}: ${initials[key]}`);
            }
            
        }

        return initials;

    }

}