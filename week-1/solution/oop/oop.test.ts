import { data } from "../fixture.ts";
import { FromCSV } from "./unitl/from-csv.ts";
import { Terrain } from "./model/terrain.ts";

function assertEqual(actual: any, expected: any, message: string): void {
    if (actual !== expected) {
        console.error(`Test failed: ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual: ${actual}`);
    } else {
        console.log(`Test passed: ${message}`);
    }
}

// Unit tests for fromCSV
function runTests() {
    console.log("Running tests for fromCSV...");

    {
        // Test 1: Single element CSV
        const csv = "grass";
        const fromCSV = FromCSV.create({
            source: csv,
        });

        if (fromCSV.valid()) {
            const items = fromCSV.parse();
            assertEqual(items.length, 0, "Single element CSV should return an array of length 0");
        }

        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 0, "Single element CSV should not have errors");
    }

    {
        // Test 2: Multiple elements CSV
        const csv = "grass,water,rock";
        const fromCSV = FromCSV.create({
            source: csv,
        });
        if (fromCSV.valid()) {
            const items = fromCSV.parse();
            assertEqual(items.length, 3, "Multiple elements CSV should return an array of length 3");
        }
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 0, "Multiple elements CSV should not have errors");
    }

    {
        // Test 3: Empty CSV
        const csv = "";
        const fromCSV = FromCSV.create({
            source: csv,
        });
        if (fromCSV.valid()) {
            const items = fromCSV.parse();
            assertEqual(items.length, 1, "Empty CSV should return an array with one empty element");
        }
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 0, "Multiple elements CSV should not have errors");

    }

    {
        // Test 4: Data from fixtures
        const fromCSV = FromCSV.create<Terrain>({
            source: data,
            factory: Terrain.create
        });
        const items = fromCSV.parse();
        assertEqual(items.length, 5, "Fixture data should return an array of length 5");

        // First item is Terrain
        assertEqual(items[0] instanceof Terrain, true, "First item should be Terrain");

        assertEqual(items[0].city, "Shanghai", "First city should be Shanghai");
        assertEqual(items[0].population, 24256800, "First city population should be 24256800");
        assertEqual(items[0].area, 6340, "First city area should be 6340");
        assertEqual(items[0].density, 3826, "First city density should be 3826");
        assertEqual(items[0].country, "China", "First city country should be China");
        
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 0, "Fixture data should not have errors");

    }

    console.log("All tests completed.");
}

// Run the tests
runTests();