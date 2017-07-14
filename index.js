const Promise = require('bluebird')
const express = require('express')

module.exports = function (...args) {
  const middlewares = args.filter(it => typeof it === 'function')
  const routeGroups = args.filter(it => typeof it === 'object').map(transformRouteGroup)
  const router = express.Router()
  middlewares.forEach(m => router.use(m))
  routeGroups.forEach(g => g.forEach(r => router[r.verb](r.path, ...r.middlewares, r.handler)))
  return router
}

const methodsMap = {
  list: ['get', '/'],
  view: ['get', '/:id'],
  create: ['post', '/'],
  update: ['put', '/:id'],
  remove: ['delete', '/:id']
}

function transformRouteGroup (group) {
  return Object.keys(group).map(key => {
    let [verb, path] = key in methodsMap ? methodsMap[key] : key.split(/\s+/)
    if (!path) {
      path = verb
      verb = 'get'
    } else {
      verb = verb.toLowerCase()
    }
    if (path[0] !== '/') {
      path = '/' + path
    }
    const handler = typeof group[key] === 'function'
      ? group[key]
      : group[key][group[key].length - 1]
    const middlewares = typeof group[key] === 'function'
      ? []
      : group[key].slice(0, -1)
    return { verb, path, middlewares, handler: wrapHandler(handler) }
  })
}

function wrapHandler (handler) {
  return (req, res, next) => Promise.try(() => handler(req, res))
    .then(result => {
      if (res.headersSent) {
        return
      }
      if (result !== undefined) {
        res.json(result)
      } else {
        res.status(404).end()
      }
    })
    .catch(next)
}
