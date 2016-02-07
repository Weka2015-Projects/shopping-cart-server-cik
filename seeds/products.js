exports.seed = function(knex, Promise) {
  return Promise.join(

    knex('users').del(),
