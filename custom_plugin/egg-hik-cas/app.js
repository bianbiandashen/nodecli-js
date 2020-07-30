'use strict'

const HikCas = require('./lib/hikcas')
const assert = require('assert')
const timeOut = 1000 * 60 * 60 * 0.5

module.exports = app => {
  const name = app.config.sessionRedis.name
  const redis = name ? app.redis.get(name) : app.redis
  assert(redis, `redis instance [${name}] not exists`)

  app.sessionStore = {
    async get(key) {
      const res = await redis.get(key)
      if (!res) return null
      return JSON.parse(res)
    },

    async set(key, value, maxAge) {
      if (maxAge === 'session') {
        maxAge =
          typeof app.config.session.sessionStoreMaxAge === 'number'
            ? app.config.session.sessionStoreMaxAge
            : timeOut
      }
      maxAge = typeof maxAge === 'number' ? maxAge : timeOut
      value = JSON.stringify(value)
      // 先判断redis中是否已经有该key，如果有的话同时延长session和hik_node_sess的时间
      const session = await app.sessionStore.get(key)
      if (session && session.cas && session.cas.st) {
        const ticket = session.cas.st

        const cas_sess = JSON.stringify({
          sessionid: key
        })

        await redis.set('hik_node_sess:' + ticket, cas_sess, 'PX', maxAge)
      }
      await redis.set(key, value, 'PX', maxAge)
    },

    async destroy(key) {
      await redis.del(key)
    }
  }

  const config = app.config.hikcas

  app.hikcas = new HikCas(config)
  if (app.config.env === 'prod') {
    addCasMiddleware(app.config.coreMiddleware)
  }
}

function addCasMiddleware(coreMiddleware) {
  let i = 0
  for (const middileWare of coreMiddleware) {
    i++
    if (middileWare === 'session') {
      break
    }
  }
  coreMiddleware.splice(i, 0, 'casCore')
}
