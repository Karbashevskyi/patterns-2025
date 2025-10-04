import { Database } from "./database.js";
import { Logger } from "./logger.js";

const logger = new Logger("output");

const schema = {
  user: { 
    keyPath: 'id', 
    autoIncrement: true,
    indexes: {
      age: { unique: false }
    }
  }
};

// Create database instance with IndexedDB driver
const database = Database.createWithIndexedDB({
  dbName: "example",
  version: 1,
  schema,
});

document.getElementById("add").onclick = () => {
  const name = prompt("Enter user name:");
  if (!name) return;

  const age = parseInt(prompt("Enter age:"), 10);
  if (!Number.isInteger(age)) return;

  database
    .add("user", { name, age })
    .then(() => {
      logger.log("Added:", { name, age });
    })
    .catch((error) => {
      logger.log("Add failed:", error.message);
    });
};

document.getElementById("get").onclick = () => {
  database.getAll("user")
    .then((users) => {
      logger.log("Users:", users);
    })
    .catch((error) => {
      logger.log("Get failed:", error.message);
    });
};

document.getElementById("update").onclick = async () => {
  try {
    const user = await database.get("user", 1);
    if (!user) {
      logger.log("User with id=1 not found");
      return;
    }

    user.age += 1;
    await database.update("user", user);
    logger.log("Updated:", user);
  } catch (error) {
    logger.log("Update failed:", error.message);
  }
};

document.getElementById("delete").onclick = () => {
  database.delete("user", 2).then(() => {
    logger.log("Deleted user with id=2");
  }).catch((error) => {
    logger.log("Delete failed:", error.message);
  });
};

document.getElementById("adults").onclick = () => {
  database.query("user", {
    filter: (user) => user.age >= 18,
  }).then((adults) => {
    logger.log("Adults:", adults);
  }).catch((error) => {
    logger.log("Adult query failed:", error.message);
  });
};
