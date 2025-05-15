import type { IFromCSVParams, IValidationFromCSV } from "../domain/interface/i.from-csv-params.ts";
import { defaultValidationsFromCSV } from "./validation.from-csv.ts";

export class FromCSV<T = object> implements IFromCSVParams {

    #source: string = '';
    #delimiter: string = ',';
    #factory = (initials: object) => initials as T;

    #validations: IValidationFromCSV[] = [
        ...defaultValidationsFromCSV,
    ];

    private readonly errors: string[] = [];

    public get source(): string {
        return this.#source;
    }

    public set source(value: string) {
        this.#source = value;
    }

    public get delimiter(): string {
        return this.#delimiter;
    }

    public set delimiter(value: string) {
        this.#delimiter = value;
    }

    public get factory(): (initials: object) => T {
        return this.#factory;
    }

    public set factory(value: (initials: object) => T) {
        this.#factory = value;
    }

    public setValidations(validations: IValidationFromCSV[]) {
        this.#validations = [...validations];
    }

    public constructor(params: Partial<IFromCSVParams>) {
        Object.assign(this, params);
    }
    
    public parse() {
        
        if (this.valid()) {

            const { source, delimiter, factory } = this;

            const data = source.split('\n').map(line => line.split(delimiter));
            const headers = data[0];
            const rows = data.slice(1);

            return rows.map(row => {
                const item: object = {};
                headers.forEach((header, index) => {
                    item[header] = row[index];
                });
                return factory(item);
            });

        }

        return [];

    }

    public valid(): boolean {

        this.errors.length = 0;

        const { source, delimiter, factory } = this;

        this.#validations.forEach((validation) => {
            validation({ source, delimiter, factory }, this.errors);
        });

        if (this.errors.length > 0) {
            return false;
        }

        return true;

    }

    public invalid(): boolean {
        return !this.valid();
    }

    public getErrors(): string[] {
        return [...this.errors];
    }

    public static create<T>(params: Partial<IFromCSVParams> = {}): FromCSV<T> {
        return new FromCSV<T>(params);
    }

}