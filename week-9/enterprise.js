/**
 * Week 9: Enterprise Approach (Over-engineered)
 * 
 * This implementation shows EXCESSIVE use of:
 * - Abstractions and interfaces
 * - Factories and builders
 * - Dependency injection
 * - Design patterns (sometimes unnecessary)
 * - Ceremonies and boilerplate
 * 
 * PROBLEMS:
 * - Too verbose
 * - Hard to follow business logic
 * - Over-abstraction
 * - Cognitive overhead
 */

// ============================================================================
// INTERFACES (Too many!)
// ============================================================================

class IQueryBuilder {}
class IWhereClauseBuilder {}
class ISelectClauseBuilder {}
class IFromClauseBuilder {}
class IJoinClauseBuilder {}
class IQueryExecutor {}
class IResultMapper {}
class IConnectionProvider {}
class IQueryValidator {}
class IQueryOptimizer {}
class ISchemaDefinition {}
class ITableDefinition {}
class IColumnDefinition {}
class IDataTypeStrategy {}

// ============================================================================
// ABSTRACT BASE CLASSES (Unnecessary layer)
// ============================================================================

class AbstractQueryBuilder extends IQueryBuilder {
  constructor(executor, validator, optimizer) {
    super();
    if (this.constructor === AbstractQueryBuilder) {
      throw new Error('Cannot instantiate abstract class');
    }
    this.executor = executor;
    this.validator = validator;
    this.optimizer = optimizer;
  }
}

class AbstractClauseBuilder {
  constructor() {
    if (this.constructor === AbstractClauseBuilder) {
      throw new Error('Cannot instantiate abstract class');
    }
  }
}

// ============================================================================
// FACTORIES (Over-used)
// ============================================================================

class QueryBuilderFactory {
  constructor(
    executorFactory,
    validatorFactory,
    optimizerFactory,
    connectionProviderFactory
  ) {
    this.executorFactory = executorFactory;
    this.validatorFactory = validatorFactory;
    this.optimizerFactory = optimizerFactory;
    this.connectionProviderFactory = connectionProviderFactory;
  }

  createQueryBuilder(type) {
    const connection = this.connectionProviderFactory.createConnectionProvider();
    const validator = this.validatorFactory.createValidator();
    const optimizer = this.optimizerFactory.createOptimizer();
    const executor = this.executorFactory.createExecutor(connection);

    switch (type) {
      case 'SELECT':
        return new SelectQueryBuilderImpl(executor, validator, optimizer);
      case 'INSERT':
        return new InsertQueryBuilderImpl(executor, validator, optimizer);
      case 'UPDATE':
        return new UpdateQueryBuilderImpl(executor, validator, optimizer);
      case 'DELETE':
        return new DeleteQueryBuilderImpl(executor, validator, optimizer);
      default:
        throw new Error(`Unsupported query type: ${type}`);
    }
  }
}

class QueryExecutorFactory {
  createExecutor(connectionProvider) {
    return new QueryExecutorImpl(connectionProvider);
  }
}

class QueryValidatorFactory {
  createValidator() {
    return new QueryValidatorImpl();
  }
}

class QueryOptimizerFactory {
  createOptimizer() {
    return new QueryOptimizerImpl();
  }
}

class ConnectionProviderFactory {
  createConnectionProvider() {
    return new ConnectionProviderImpl();
  }
}

// ============================================================================
// STRATEGIES (Overused pattern)
// ============================================================================

class DataTypeStrategy {
  format(value) {
    throw new Error('Must implement format method');
  }
}

class StringDataTypeStrategy extends DataTypeStrategy {
  format(value) {
    return `'${value.replace(/'/g, "''")}'`;
  }
}

class NumberDataTypeStrategy extends DataTypeStrategy {
  format(value) {
    return String(value);
  }
}

class BooleanDataTypeStrategy extends DataTypeStrategy {
  format(value) {
    return value ? '1' : '0';
  }
}

class DateDataTypeStrategy extends DataTypeStrategy {
  format(value) {
    return `'${value.toISOString()}'`;
  }
}

class DataTypeStrategyFactory {
  constructor() {
    this.strategies = {
      string: new StringDataTypeStrategy(),
      number: new NumberDataTypeStrategy(),
      boolean: new BooleanDataTypeStrategy(),
      date: new DateDataTypeStrategy(),
    };
  }

  getStrategy(type) {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`No strategy found for type: ${type}`);
    }
    return strategy;
  }
}

// ============================================================================
// BUILDERS (Excessive ceremony)
// ============================================================================

class WhereClauseBuilder extends AbstractClauseBuilder {
  constructor(dataTypeStrategyFactory) {
    super();
    this.conditions = [];
    this.dataTypeStrategyFactory = dataTypeStrategyFactory;
  }

  addCondition(field, operator, value, logicalOperator = 'AND') {
    const condition = new WhereCondition(
      field,
      operator,
      value,
      logicalOperator,
      this.dataTypeStrategyFactory
    );
    this.conditions.push(condition);
    return this;
  }

  build() {
    if (this.conditions.length === 0) {
      return '';
    }

    const clauses = this.conditions.map((c, i) => {
      const condition = c.build();
      if (i === 0) {
        return condition;
      }
      return `${c.logicalOperator} ${condition}`;
    });

    return `WHERE ${clauses.join(' ')}`;
  }
}

class WhereCondition {
  constructor(field, operator, value, logicalOperator, dataTypeStrategyFactory) {
    this.field = field;
    this.operator = operator;
    this.value = value;
    this.logicalOperator = logicalOperator;
    this.dataTypeStrategyFactory = dataTypeStrategyFactory;
  }

  build() {
    const type = typeof this.value;
    const strategy = this.dataTypeStrategyFactory.getStrategy(type);
    const formattedValue = strategy.format(this.value);
    return `${this.field} ${this.operator} ${formattedValue}`;
  }
}

class SelectClauseBuilder extends AbstractClauseBuilder {
  constructor() {
    super();
    this.fields = [];
  }

  addField(field, alias = null) {
    this.fields.push(new SelectField(field, alias));
    return this;
  }

  addFields(fields) {
    fields.forEach(field => this.addField(field));
    return this;
  }

  build() {
    if (this.fields.length === 0) {
      return 'SELECT *';
    }
    return `SELECT ${this.fields.map(f => f.build()).join(', ')}`;
  }
}

class SelectField {
  constructor(field, alias) {
    this.field = field;
    this.alias = alias;
  }

  build() {
    if (this.alias) {
      return `${this.field} AS ${this.alias}`;
    }
    return this.field;
  }
}

// ============================================================================
// MAIN QUERY BUILDER (Too complex)
// ============================================================================

class SelectQueryBuilderImpl extends AbstractQueryBuilder {
  constructor(executor, validator, optimizer) {
    super(executor, validator, optimizer);
    this.dataTypeStrategyFactory = new DataTypeStrategyFactory();
    this.selectClauseBuilder = new SelectClauseBuilder();
    this.whereClauseBuilder = new WhereClauseBuilder(this.dataTypeStrategyFactory);
    this.fromTable = null;
    this.joins = [];
    this.orderByFields = [];
    this.limitValue = null;
  }

  select(...fields) {
    if (fields.length === 0) {
      return this;
    }
    this.selectClauseBuilder.addFields(fields);
    return this;
  }

  from(table) {
    this.fromTable = table;
    return this;
  }

  where(field, operator, value) {
    this.whereClauseBuilder.addCondition(field, operator, value, 'AND');
    return this;
  }

  orWhere(field, operator, value) {
    this.whereClauseBuilder.addCondition(field, operator, value, 'OR');
    return this;
  }

  join(table, leftField, operator, rightField) {
    this.joins.push(new JoinClause(table, leftField, operator, rightField, 'INNER'));
    return this;
  }

  leftJoin(table, leftField, operator, rightField) {
    this.joins.push(new JoinClause(table, leftField, operator, rightField, 'LEFT'));
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByFields.push(new OrderByClause(field, direction));
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  build() {
    if (!this.fromTable) {
      throw new Error('FROM clause is required');
    }

    const parts = [];

    parts.push(this.selectClauseBuilder.build());
    parts.push(`FROM ${this.fromTable}`);

    if (this.joins.length > 0) {
      parts.push(this.joins.map(j => j.build()).join(' '));
    }

    const whereClause = this.whereClauseBuilder.build();
    if (whereClause) {
      parts.push(whereClause);
    }

    if (this.orderByFields.length > 0) {
      parts.push(
        `ORDER BY ${this.orderByFields.map(o => o.build()).join(', ')}`
      );
    }

    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    return parts.join(' ');
  }

  async execute() {
    const query = this.build();
    this.validator.validate(query);
    const optimizedQuery = this.optimizer.optimize(query);
    return await this.executor.execute(optimizedQuery);
  }
}

class JoinClause {
  constructor(table, leftField, operator, rightField, type) {
    this.table = table;
    this.leftField = leftField;
    this.operator = operator;
    this.rightField = rightField;
    this.type = type;
  }

  build() {
    return `${this.type} JOIN ${this.table} ON ${this.leftField} ${this.operator} ${this.rightField}`;
  }
}

class OrderByClause {
  constructor(field, direction) {
    this.field = field;
    this.direction = direction;
  }

  build() {
    return `${this.field} ${this.direction}`;
  }
}

// ============================================================================
// IMPLEMENTATIONS (More boilerplate)
// ============================================================================

class QueryExecutorImpl extends IQueryExecutor {
  constructor(connectionProvider) {
    super();
    this.connectionProvider = connectionProvider;
  }

  async execute(query) {
    const connection = await this.connectionProvider.getConnection();
    console.log('Enterprise: Executing query:', query);
    // Simulate execution
    return [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
    ];
  }
}

class QueryValidatorImpl extends IQueryValidator {
  validate(query) {
    console.log('Enterprise: Validating query');
    // Simulate validation
    return true;
  }
}

class QueryOptimizerImpl extends IQueryOptimizer {
  optimize(query) {
    console.log('Enterprise: Optimizing query');
    // Simulate optimization
    return query;
  }
}

class ConnectionProviderImpl extends IConnectionProvider {
  async getConnection() {
    console.log('Enterprise: Getting database connection');
    // Simulate connection
    return { connected: true };
  }
}

// ============================================================================
// DEPENDENCY INJECTION CONTAINER (More ceremony)
// ============================================================================

class DependencyContainer {
  constructor() {
    this.instances = new Map();
    this.factories = new Map();
  }

  register(name, factory) {
    this.factories.set(name, factory);
  }

  resolve(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`No factory registered for: ${name}`);
    }

    const instance = factory(this);
    this.instances.set(name, instance);
    return instance;
  }
}

// ============================================================================
// USAGE (Too complicated for simple task)
// ============================================================================

function setupEnterpriseContainer() {
  const container = new DependencyContainer();

  container.register('connectionProviderFactory', () => new ConnectionProviderFactory());
  container.register('executorFactory', () => new QueryExecutorFactory());
  container.register('validatorFactory', () => new QueryValidatorFactory());
  container.register('optimizerFactory', () => new QueryOptimizerFactory());

  container.register('queryBuilderFactory', (c) => {
    return new QueryBuilderFactory(
      c.resolve('executorFactory'),
      c.resolve('validatorFactory'),
      c.resolve('optimizerFactory'),
      c.resolve('connectionProviderFactory')
    );
  });

  return container;
}

export async function enterpriseExample() {
  console.log('\n=== ENTERPRISE APPROACH ===\n');

  const container = setupEnterpriseContainer();
  const factory = container.resolve('queryBuilderFactory');
  
  const queryBuilder = factory.createQueryBuilder('SELECT');
  
  const results = await queryBuilder
    .select('id', 'name', 'email')
    .from('users')
    .where('age', '>', 18)
    .where('active', '=', true)
    .orderBy('name', 'ASC')
    .limit(10)
    .execute();

  console.log('Results:', results);
  console.log('\nNotice: Too many layers of abstraction!');
  console.log('Files needed: ~15-20 separate files');
  console.log('Lines of code: ~500+ for simple query');
}

// Export for comparison
export {
  QueryBuilderFactory,
  SelectQueryBuilderImpl,
  DependencyContainer,
  setupEnterpriseContainer,
};
