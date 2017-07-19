const express = require('express')
const sinon = require('sinon')
const supertest = require('supertest')
const brouter = require('./')

require('should')
require('should-sinon')

describe('brouter', function () {
  beforeEach(function () {
    this.app = express()
    this.request = supertest(this.app)
  })
  it('shoult alias "list" to "get /"', function () {
    const routes = { list: sinon.spy(() => 'ok') }
    this.app.use('/this', brouter(routes))
    return this.request
      .get('/this')
      .expect(200)
      .then(() => routes.list.should.be.called)
  })
  it('shoult alias "view" to "get /:id"', function () {
    const routes = { view: sinon.spy(() => 'ok') }
    this.app.use('/this', brouter(routes))
    return this.request
      .get('/this/10')
      .expect(200)
      .then(() => routes.view.should.be.called)
  })
  it('shoult alias "create" to "post /"', function () {
    const routes = { create: sinon.spy(() => 'ok') }
    this.app.use('/this', brouter(routes))
    return this.request
      .post('/this')
      .expect(200)
      .then(() => routes.create.should.be.called)
  })
  it('shoult alias "update" to "put /:id"', function () {
    const routes = { update: sinon.spy(() => 'ok') }
    this.app.use('/this', brouter(routes))
    return this.request
      .put('/this/10')
      .expect(200)
      .then(() => routes.update.should.be.called)
  })
  it('shoult alias "remove" to "delete /:id"', function () {
    const routes = { remove: sinon.spy(() => 'ok') }
    this.app.use('/this', brouter(routes))
    return this.request
      .del('/this/10')
      .expect(200)
      .then(() => routes.remove.should.be.called)
  })
  it('should serialize result to JSON', function () {
    const routes = { list: () => [{ a: 1 }, { a: 2 }] }
    this.app.use('/this', brouter(routes))
    return this.request
      .get('/this')
      .expect(200)
      .then(response => response.body.should.eql([{ a: 1 }, { a: 2 }]))
  })
  it('should return 404 if result is undefined', function () {
    const routes = { view: () => { } }
    this.app.use('/this', brouter(routes))
    return this.request
      .get('/this/10')
      .expect(404)
  })
  it('should use global middleware', function () {
    const middleware = (req, res, next) => { res.status(401).end() }
    this.app.use('/this', brouter(middleware, { list: () => [] }))
    return this.request
      .get('/this')
      .expect(401)
  })
  it('should use local middleware', function () {
    const middleware = (req, res, next) => { res.status(403).end() }
    this.app.use('/this', brouter({ list: [middleware, () => []] }))
    return this.request
      .get('/this')
      .expect(403)
  })
  it('should allow verbless paths', function () {
    const routes = { mypath: sinon.spy(() => 'ok') }
    this.app.use('/that', brouter(routes))
    return this.request
      .get('/that/mypath')
      .expect(200)
      .then(() => routes.mypath.should.be.called)
  })
  it('should allow verbful paths', function () {
    const routes = { 'post mypath': sinon.spy(() => 'ok') }
    this.app.use('/these', brouter(routes))
    return this.request
      .post('/these/mypath')
      .expect(200)
      .then(() => routes['post mypath'].should.be.called)
  })
  it('should allow verbful (uppercase) paths', function () {
    const routes = { 'POST mypath': sinon.spy(() => 'ok') }
    this.app.use('/these', brouter(routes))
    return this.request
      .post('/these/mypath')
      .expect(200)
      .then(() => routes['POST mypath'].should.be.called)
  })
  it('should not process result if handler used res methods', function () {
    this.app.use('/this', brouter({ path: (req, res) => { res.json(42) } }))
    return this.request
      .get('/this/path')
      .expect(200)
      .then(response => response.body.should.eql(42))
  })
  describe('compose', function () {
    it('should compose routers', function () {
      const router1 = brouter({ '/a': () => 1 })
      const router2 = brouter({ '/b': () => 2 })
      this.app.use(brouter.compose({ router1, router2 }))
      return this.request
        .get('/router2/b')
        .expect(200)
        .then(response => response.body.should.eql(2))
    })
  })
})
