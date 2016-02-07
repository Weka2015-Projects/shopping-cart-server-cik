import koa from 'koa'
import Resource from 'koa-resource-router'
import koaBody from 'koa-better-body'
import knex from 'koa-knex'
import path from 'path'
import 'babel-polyfill'

const PORT = process.env.PORT || 4000

// Export the app for use in the tests
const app = module.exports = koa()

// Add the body parser to parse both multipart forms and JSON (for later use)
app.use(koaBody({
  extendTypes: {
    json: [ 'application/x-javascript' ],
  }
}))

// Requests with a body must be type JSON
app.use(function *(next) {
  let noBody = this.method === 'GET' ||
    this.method === 'DELETE' ||
    this.method === 'OPTION'

  if (noBody || this.is('application/json')) {
    yield next
  } else {
    this.status = 400
  }
})

// Requests with JSON response must accept JSON
app.use(function *(next) {
  let noResponse = this.method === 'PUT' ||
    this.method === 'DELETE' ||
    this.method === 'OPTION'

  if (noResponse || this.accepts('application/json')) {
    yield next
  } else {
    this.status = 400
  }
})

const dbName = `product_list`

app.use(knex({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    port     : '5432',
    database : dbName
  },
  searchPath: 'public'
}))

const users = new Resource('users', {
  // GET /users
  index: function *(next) {
    this.body = yield { users: this.knex('users') }
  },

  // POST /users
  create: function *(next) {
    try {
      const res = yield this.knex('users').returning('*').insert({
        name: this.request.body.fields.name,
        email: this.request.body.fields.email,
        created_at: new Date(),
        updated_at: new Date()
      })

      this.type = 'application/json'
      this.status = 201
      this.set('Location', `/users/${res[0].id}`)
      this.body = { user: res[0] }
    } catch (e) {
      console.log(e)
      this.status = 422
    }
  },

  // GET /users/:id
  show: function *(next) {
    let id = this.params.user

    // You can also write the SQL by hand and just use knex to send it
    let res = yield this.knex.raw('select * from users where id = ?', id)

    if (res.rows.length === 1) {
      this.body = { user: res.rows[0] }
    } else {
      this.status = 404
    }
  },

  // PUT /users/:id
  update: function *(next) {
    let id = this.params.user
    let name = this.request.body.fields.name
    let email = this.request.body.fields.email
    console.log(name ,email)
    yield this.knex.raw('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id])
    this.body = { message: `Update user #${id}` }
  },

  // DELETE /users/:id
  destroy: function *(next) {
    let id = this.params.user
    yield this.knex.raw('DELETE FROM users Where id = ?', id)
    this.body = { message: `Delete user #${id}` }
  }
})

app.use(users.middleware())

// Start the application up on port PORT
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} . . .`)
})
