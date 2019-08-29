'use strict'

var redis = require('redis');

class mehrdadRedis {
  constructor (host='127.0.0.1', port='6379') {
    this.client = redis.createClient(`redis://${host}:${port}`)
    this.status = 'disconnected'
  }
  async connect() {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.on('connect', function() {
        console.log('Redis client connected')
        that.status = 'connected'
        resolve(true)
      });
      that.client.on('error', function (err) {
        console.log('Something went wrong ' + err)
        reject(err)
      });
    })
  }
  async select(database) {
    if(this.status!='connected') {
      return false
    }
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.select(database, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async hmset(stageKey, value) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.hmset(stageKey, value, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async expire(stageKey, value) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.expire(stageKey, value, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async del(stageKey, value) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.del(stageKey, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async hmgetall(stageKey) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.hmgetall(stageKey, function(err, result){
        if(err) {
          reject(err)
        }else {
          resolve(result)
        }
      })
    })
  }
  async get(stageKey) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.get(stageKey, function(err, result){
        if(err) {
          reject(err)
        }else {
          resolve(result)
        }
      })
    })
  }
  async ltrim(stageKey, value) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.ltrim(stageKey, value, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async rpush(stageKey, value) {
    let that = this
    return new Promise(function(resolve, reject) {
      that.client.rpush(stageKey, value, function(err){
        if(err) {
          reject(err)
        }else {
          resolve(true)
        }
      })
    })
  }
  async psubscribe(channel, cb) {
    this.client.subscribe(channel)
    this.client.on('message', async function(channel, message) {
      cb(channel, message, null)
    })
  }
}
// const Redis = new mehrdadRedis(process.env.REDIS_URL || '127.0.0.1')
// async function start() {
//   try{
//     await Redis.connect()
//     await Redis.select(1)
//     await Redis.hmset('asd2313', [
//       'user',
//       1
//     ])
//   }catch(e){
//     console.log('Error', e)
//   }
// }
// start()
module.exports = mehrdadRedis
