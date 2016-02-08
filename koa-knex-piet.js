var Knex = require('knex');

module.exports = function (opts) {
  return function *knex(next) {
    var conn = opts.connection || { };
    var env = process.env;
    global.__knex || (global.__knex = Knex.initialize({
      client: opts.client,
      connection: conn
    }));
    this.knex = global.__knex;

    yield next;
  };
};
