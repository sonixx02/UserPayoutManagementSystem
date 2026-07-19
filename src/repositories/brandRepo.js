// data access for the brands table
// each brand has its own advance rate in basis points

class BrandRepository {
  constructor(db) {
    this.db = db;
  }

  // create a brand or update its rate if it already exists
  create(name, advanceRateBps = 1000) {
    this.db
      .prepare(
        `INSERT INTO brands (name, advance_rate_bps)
         VALUES (@name, @advanceRateBps)
         ON CONFLICT(name) DO UPDATE SET advance_rate_bps = excluded.advance_rate_bps`
      )
      .run({ name, advanceRateBps });
    return this.findByName(name);
  }

  // find a brand by name and return the row or undefined
  findByName(name) {
    return this.db.prepare('SELECT * FROM brands WHERE name = @name').get({ name });
  }

  // list all brands
  list() {
    return this.db.prepare('SELECT * FROM brands ORDER BY name').all();
  }

  // true if the brand exists 
  exists(name) {
    return this.findByName(name) !== undefined;
  }
}

module.exports = BrandRepository;
