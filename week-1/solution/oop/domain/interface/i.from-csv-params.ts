export type IValidationFromCSV = (context: Pick<IFromCSVParams, 'source' | 'delimiter' | 'factory'>, errors: string[]) => void;

export interface IFromCSVParams {
    source: string;
    delimiter: string;
    factory: Function;
    setValidations: (validations: IValidationFromCSV[]) => void;
}