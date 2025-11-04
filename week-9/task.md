# Week 9: Semantics - Expressive DSLs

## Task Description

Develop a **balanced implementation** between:
- **Enterprise approach**: Overcomplicated with excessive ceremonies, abstractions, and interfaces
- **Pragmatic approach**: Too simple, breaking Separation of Concerns (SoC) and Single Responsibility Principle (SRP)

Take the best of both worlds:
- ✅ Expressive DSL for queries and schemas (from Pragmatic)
- ✅ Proper responsibility assignment (from Enterprise)

## Comparison: Enterprise vs Pragmatic

### Enterprise Approach (Over-engineered)

**Characteristics:**
- Excessive abstraction layers
- Too many interfaces and factories
- Complex dependency injection
- Ceremony-heavy code
- Following patterns for the sake of patterns

**Pros:**
- Clear separation of concerns
- Easy to test individual components
- Follows SOLID principles strictly
- Scalable for large teams
- Well-defined contracts

**Cons:**
- ❌ Verbose and hard to read
- ❌ Too many files and classes
- ❌ Cognitive overhead for simple tasks
- ❌ Difficult to onboard new developers
- ❌ Over-abstraction hides business logic
- ❌ Premature optimization

### Pragmatic Approach (Too Simple)

**Characteristics:**
- Direct implementation
- Minimal abstraction
- Inline logic
- Quick to write
- Expressive and readable

**Pros:**
- Quick to implement
- Easy to understand at first glance
- Less code to maintain
- Expressive DSL syntax
- Low cognitive overhead

**Cons:**
- ❌ Breaks Separation of Concerns
- ❌ Violates Single Responsibility
- ❌ Hard to test in isolation
- ❌ Difficult to extend
- ❌ Tight coupling
- ❌ Business logic mixed with infrastructure

### Balanced Approach (Best of Both)

**Characteristics:**
- Expressive DSL with fluent API
- Clear responsibility boundaries
- Minimal but sufficient abstraction
- Testable components
- Readable business logic

**Goals:**
- ✅ Expressive, readable syntax
- ✅ Proper separation of concerns
- ✅ Single responsibility per component
- ✅ Easy to test
- ✅ Easy to extend
- ✅ No unnecessary abstractions
- ✅ Clear business logic flow

## Implementation Focus

We'll implement a **Query Builder DSL** for database operations as an example:

### Features to implement:
1. **Schema Definition** - Expressive table/field definitions
2. **Query Builder** - Fluent API for SELECT, WHERE, JOIN, etc.
3. **Validation** - Type-safe queries
4. **Execution** - Actual query execution
5. **Result Mapping** - Transform results to objects

### Three Implementations:
1. **Enterprise** - Over-engineered with factories, builders, strategies, visitors
2. **Pragmatic** - Simple chain of methods, mixing concerns
3. **Balanced** - Expressive DSL with proper responsibility assignment

## Evaluation Criteria

- **Readability**: How easy to understand the code
- **Maintainability**: How easy to modify and extend
- **Testability**: How easy to write unit tests
- **Expressiveness**: How close to natural language
- **Complexity**: Number of abstractions and indirections
- **Business Logic Clarity**: How visible the intent is
