// data access for the users table
// keeps all user sql in one place

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  // create a new user and return the created row
  create(id) {
    this.db.prepare('INSERT INTO users (id) VALUES (@id)').run({ id });
    return this.findById(id);
  }

  // find a user by id and return the row or undefined
  findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = @id').get({ id });
  }

  // list all users
  list() {
    return this.db.prepare('SELECT * FROM users ORDER BY id ASC').all();
  }

  // true if the user exists 
  exists(id) {
    return this.findById(id) !== undefined;
  }
}

module.exports = UserRepository;
