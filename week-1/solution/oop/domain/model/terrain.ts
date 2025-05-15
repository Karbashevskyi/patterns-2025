import type { ITerrain } from "../interface/i.terrain.ts";


export class Terrain implements ITerrain {
    
    public readonly city: string;
    public readonly population: number;
    public readonly area: number;
    public readonly density: number;
    public readonly country: string;

    public constructor(initials: ITerrain) {
        Object.assign(this, initials);
    }

    public static create(initials: ITerrain): Terrain {
        return new Terrain(initials);
    }

}