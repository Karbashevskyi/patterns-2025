import { Terrain } from "./domain/model/terrain.ts";
import { FromCSV } from "./unitl/from-csv.ts";
import { data } from "../fixture.ts";
import { TerrainMapper } from "./application/mapper/terrain.mapper.ts";
import { ListConsole } from "./presentation/console/list.console.ts";
import type { IListConsoleConfiguration } from "./presentation/interface/i.list.console.configuration.ts";
import type { ITerrainWithStatistic } from "./domain/interface/i.terrain-with-statistic.ts";

export const terrainPresentationListConfigutation: IListConsoleConfiguration<ITerrainWithStatistic> = {
    title: 'List of Terrains:',
    columns: {
        _index: {
            title: '#',
            style: {
                pad: {
                    side: 'right',
                    length: 4,
                },
            },
            format: (value, index) => `${index + 1}`,
        },
        city: {
            title: 'City',
            style: {
                pad: {
                    side: 'right',
                    length: 18,
                },
            },
        },
        population: {
            title: 'Population',
            style: {
                pad: {
                    side: 'left',
                    length: 10,
                },
            },
        },
        area: {
            title: 'Area',
            style: {
                pad: {
                    side: 'left',
                    length: 8,
                },
            },
        },
        density: {
            title: 'Density',
            style: {
                pad: {
                    side: 'left',
                    length: 8,
                },
            },
        },
        country: {
            title: 'Country',
            style: {
                pad: {
                    side: 'left',
                    length: 18,
                },
            },
        },
        areaPercentageOfMax: {
            title: 'Area Percentage of Max',
            // This comment shows an example of adding a column without styles.
            // style: { 
            //     pad: {
            //         side: 'left',
            //         length: 8,
            //     },
            // },
            format: (value) => `${value}%`,
        }
    },
    sortBy: 'areaPercentageOfMax',
    sortOrder: 'asc',
};

export class Bootstrap {

    public static run(source: string): void {

        const mapper = TerrainMapper.create();
        const fromCSV = FromCSV.create<Terrain>({
            source,
            factory: (object) => mapper.fromObject(object),
        });

        if (fromCSV.invalid()) {
            console.error(fromCSV.getErrors());
            throw new Error('Invalid CSV data');
        }
        
        const items = fromCSV.parse();

        const render = ListConsole.create(terrainPresentationListConfigutation);
        const list = mapper.toTerrainWithStatisticList(items);
        render.setList(list);
        render.render();
        
    }
    
}

Bootstrap.run(data);

