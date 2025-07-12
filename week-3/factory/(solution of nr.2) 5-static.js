'use strict';

class Person {
  constructor(name) {
    this.name = name;
  }

  static factory(name) {
    return new Person(name);
  }
}

const createPerson = Person.factory;

module.exports = {
  Person,
  createPerson,
};