// ============================================================================
// ALL-IN-ONE QUERY BUILDER (Mixing everything)
// ============================================================================

class ValueFormatter {
  format(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (Array.isArray(value)) {
      const formatted = value.map(v => this.format(v)).join(', ');
      return `(${formatted})`;
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    return String(value);
  }
}

class Query {
  #select = [];
  #from = null;
  #where = [];
  #joins = [];
  #orderBy = [];
  #limit = null;
  #offset = null;
  #groupBy = [];
  #having = [];
  #formatter = new ValueFormatter();

  select(...fields) {
    this.#select = fields;
    return this;
  }

  from(table) {
    this.#from = table;
    return this;
  }

  where(field, operator, value) {
    const formatted = this.#formatter.format(value);
    this.#where.push({ field, operator, value: formatted, logic: 'AND' });
    return this;
  }

  orWhere(field, operator, value) {
    const formatted = this.#formatter.format(value);
    this.#where.push({ field, operator, value: formatted, logic: 'OR' });
    return this;
  }

  whereRaw(sql) {
    this.#where.push({ raw: sql, logic: 'AND' });
    return this;
  }

  join(table, leftField, rightField) {
    this.#joins.push({ type: 'INNER', table, leftField, rightField });
    return this;
  }

  leftJoin(table, leftField, rightField) {
    this.#joins.push({ type: 'LEFT', table, leftField, rightField });
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.#orderBy.push({ field, direction });
    return this;
  }

  groupBy(...fields) {
    this.#groupBy = fields;
    return this;
  }

  having(field, operator, value) {
    const formatted = this.#formatter.format(value);
    this.#having.push({ field, operator, value: formatted });
    return this;
  }

  limit(value) {
    this.#limit = value;
    return this;
  }

  offset(value) {
    this.#offset = value;
    return this;
  }

  whereId(id) {
    return this.where('id', '=', id);
  }

  whereIn(field, values) {
    const formatted = values.map(v => this.#formatter.format(v)).join(', ');
    this.#where.push({ field, operator: 'IN', value: `(${formatted})`, logic: 'AND' });
    return this;
  }

  whereLike(field, pattern) {
    return this.where(field, 'LIKE', pattern);
  }

  whereNull(field) {
    this.#where.push({ field, operator: 'IS', value: 'NULL', logic: 'AND' });
    return this;
  }

  whereNotNull(field) {
    this.#where.push({ field, operator: 'IS NOT', value: 'NULL', logic: 'AND' });
    return this;
  }

  toSQL() {
    const parts = [];

    if (this.#select.length === 0) {
      parts.push('SELECT *');
    } else {
      parts.push(`SELECT ${this.#select.join(', ')}`);
    }

    if (!this.#from) {
      throw new Error('FROM clause is required');
    }
    parts.push(`FROM ${this.#from}`);

    if (this.#joins.length > 0) {
      this.#joins.forEach(j => {
        parts.push(`${j.type} JOIN ${j.table} ON ${j.leftField} = ${j.rightField}`);
      });
    }

    if (this.#where.length > 0) {
      const conditions = this.#where.map((w, i) => {
        if (w.raw) {
          return i === 0 ? w.raw : `${w.logic} ${w.raw}`;
        }
        const condition = `${w.field} ${w.operator} ${w.value}`;
        return i === 0 ? condition : `${w.logic} ${condition}`;
      });
      parts.push(`WHERE ${conditions.join(' ')}`);
    }

    if (this.#groupBy.length > 0) {
      parts.push(`GROUP BY ${this.#groupBy.join(', ')}`);
    }

    if (this.#having.length > 0) {
      const conditions = this.#having.map(h => `${h.field} ${h.operator} ${h.value}`);
      parts.push(`HAVING ${conditions.join(' AND ')}`);
    }

    if (this.#orderBy.length > 0) {
      const orders = this.#orderBy.map(o => `${o.field} ${o.direction}`);
      parts.push(`ORDER BY ${orders.join(', ')}`);
    }

    if (this.#limit !== null) {
      parts.push(`LIMIT ${this.#limit}`);
    }

    if (this.#offset !== null) {
      parts.push(`OFFSET ${this.#offset}`);
    }

    return parts.join(' ');
  }

  async execute() {
    const sql = this.toSQL();
    console.log('Pragmatic: Executing:', sql);

    return this.#mockExecute(sql);
  }

  async first() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }

  async get() {
    return await this.execute();
  }

  async #mockExecute(sql) {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return [
      { id: 1, name: 'John', email: 'john@example.com', age: 25 },
      { id: 2, name: 'Jane', email: 'jane@example.com', age: 30 },
    ];
  }

  async map(fn) {
    const results = await this.execute();
    return results.map(fn);
  }

  async pluck(field) {
    const results = await this.execute();
    return results.map(r => r[field]);
  }

  async count() {
    this.#select = ['COUNT(*) as count'];
    const results = await this.execute();
    return results[0]?.count || 0;
  }
}

// ============================================================================
// SCHEMA DEFINITION (Mixing schema with validation and formatting)
// ============================================================================

class Schema {
  constructor() {
    this.tables = {};
  }

  table(name, callback) {
    const table = new Table(name);
    callback(table);
    this.tables[name] = table;
    return this;
  }

  getTable(name) {
    return this.tables[name];
  }

  toSQL() {
    return Object.values(this.tables)
      .map(table => table.toSQL())
      .join('\n\n');
  }
}

class Table {
  constructor(name) {
    this.name = name;
    this.columns = [];
    this.indexes = [];
    this.primaryKey = null;
  }

  id() {
    this.columns.push({ name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true });
    this.primaryKey = 'id';
    return this;
  }

  string(name, length = 255) {
    this.columns.push({ name, type: `VARCHAR(${length})` });
    return this;
  }

  integer(name) {
    this.columns.push({ name, type: 'INTEGER' });
    return this;
  }

  boolean(name) {
    this.columns.push({ name, type: 'BOOLEAN' });
    return this;
  }

  date(name) {
    this.columns.push({ name, type: 'DATE' });
    return this;
  }

  timestamp(name) {
    this.columns.push({ name, type: 'TIMESTAMP' });
    return this;
  }

  text(name) {
    this.columns.push({ name, type: 'TEXT' });
    return this;
  }

  nullable() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.nullable = true;
    return this;
  }

  notNullable() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.nullable = false;
    return this;
  }

  defaultValue(value) {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.default = value;
    return this;
  }

  unique() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.unique = true;
    return this;
  }

  index(fields) {
    this.indexes.push({ fields: Array.isArray(fields) ? fields : [fields] });
    return this;
  }

  toSQL() {
    const columnDefs = this.columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement) def += ' AUTO_INCREMENT';
      if (col.nullable === false) def += ' NOT NULL';
      if (col.default !== undefined) def += ` DEFAULT ${col.default}`;
      if (col.unique) def += ' UNIQUE';
      
      return def;
    });

    const indexDefs = this.indexes.map((idx, i) => {
      return `  INDEX idx_${this.name}_${i} (${idx.fields.join(', ')})`;
    });

    const allDefs = [...columnDefs, ...indexDefs];

    return `CREATE TABLE ${this.name} (\n${allDefs.join(',\n')}\n);`;
  }
}

// ============================================================================
// HELPER FUNCTIONS (Direct and expressive but mixing concerns)
// ============================================================================

function query() {
  return new Query();
}

function schema() {
  return new Schema();
}


// ============================================================================
// USAGE (Very expressive and readable!)
// ============================================================================

export async function pragmaticExample() {
  console.log('\n=== PRAGMATIC APPROACH ===\n');

  const db = schema()
    .table('users', t => {
      t.id();
      t.string('name').notNullable();
      t.string('email').unique().notNullable();
      t.integer('age');
      t.boolean('active').defaultValue(true);
      t.timestamp('created_at').notNullable();
      t.index('email');
    })
    .table('posts', t => {
      t.id();
      t.integer('user_id').notNullable();
      t.string('title').notNullable();
      t.text('content');
      t.timestamp('published_at');
      t.index('user_id');
    });

  console.log('Schema SQL:');
  console.log(db.toSQL());

  console.log('\n--- Query Examples ---\n');

  const users = await query()
    .select('id', 'name', 'email')
    .from('users')
    .where('age', '>', 18)
    .where('active', '=', true)
    .orderBy('name', 'ASC')
    .limit(10)
    .get();

  console.log('Users:', users);

  const posts = await query()
    .select('posts.*', 'users.name as author')
    .from('posts')
    .join('users', 'posts.user_id', 'users.id')
    .where('posts.published_at', 'IS NOT', null)
    .orderBy('posts.published_at', 'DESC')
    .limit(5)
    .get();

  console.log('Posts:', posts);

  const user = await query()
    .from('users')
    .whereId(1)
    .first();

  console.log('Single user:', user);

  const emails = await query()
    .from('users')
    .whereIn('id', [1, 2, 3])
    .pluck('email');

  console.log('Emails:', emails);

  console.log('\nNotice: Very readable and expressive!');
  console.log('Files needed: 1 file');
  console.log('Lines of code: ~300 for full functionality');
  console.log('BUT: Everything is mixed together!');
}

export { Query, Schema, query, schema };
