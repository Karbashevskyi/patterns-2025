"use strict";

class Product {
  field;
}

class ProductFactory {
  constructor(initials = {
    field: "default value",
  }) {
    this.defaults = initials;
  }

  create(initials = this.defaults) {
    const instance = new Product();
    Object.assign(instance, initials);
    return instance;
  }
}

// Usage
const productFactory = new ProductFactory({ field: "value" });
console.dir(productFactory);

const product = productFactory.create();
console.dir(product);
