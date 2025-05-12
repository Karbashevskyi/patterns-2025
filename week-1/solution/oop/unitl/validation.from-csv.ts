import type { IValidationFromCSV } from "../domain/interface/i.from-csv-params";

export function SourceValidation({ source }, errors: string[]) {
    if (!source) {
        errors.push('Source is required');
    } else {

        if (source.split('\n').length < 2) {
            errors.push('Source has no enough lines');
        }
    }
}

export function DelimiterValidation({delimiter}, errors: string[]) {
    if (!delimiter) {
        errors.push('Delimiter is required');
    }
}

export function SourceAndDelimiterValidation({ source, delimiter }, errors: string[]) {

    if (source.split('\n')[0].split(delimiter).length < 1) {
        errors.push('Source has no enough columns');
    }

    /**
     * * Check if the first line has the same number of columns as the second line
     */
    if (source.split('\n')[0].split(delimiter).length !== source?.split?.('\n')?.[1]?.split?.(delimiter)?.length) {
        errors.push('Source is not a valid CSV');
    }
    
}

export function FactoryValidation({factory}, errors: string[]) {
    if (!factory) {
        errors.push('Factory is required');
    } else {
        if (typeof factory !== 'function') {
            errors.push('Factory must be a function');
        }
    }
}

export const validationFromCSV: {
    [key: string]: IValidationFromCSV
} = {
    SourceValidation,
    DelimiterValidation,
    SourceAndDelimiterValidation,
    FactoryValidation,
};

export const defaultValidationsFromCSV: IValidationFromCSV[] = [
    SourceValidation,
    DelimiterValidation,
    SourceAndDelimiterValidation,
    FactoryValidation,
];