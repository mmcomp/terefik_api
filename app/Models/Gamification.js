'use strict'

const Model = use('Model')

const Env = use('Env')
const Fetch = require("node-fetch")

class Gamification extends Model {
  async req(method, func, token, body) {
    let options = {
      method: (method && method!='')?method:'get',
      headers: { 'Content-Type': 'application/json' },
    }
    if(body && method=='post') {
      options['body'] = JSON.stringify(body)
    }
    if(token) {
      options['headers']['Authorization'] = 'Bearer ' + token
    }
    const response = Fetch(Env.get('GAMIFICATION_URL') + func, options);
    return response
  }

  async login() {
    try{
      let body = {
        email: Env.get('GAMIFICATION_EMAIL'),
        password: Env.get('GAMIFICATION_PASSWORD'),
      }
      let res = await this.req('post', 'login', null, body)
      res = await res.json()
      if(res.status==1) {
        this.token = res.data.token
      }
      return res
    }catch(e) {
      return {
        status: 0,
        messages: [{
          code: "GamificationConnectionError",
          message: "خطا در اتصال به سرور بازی انگاری",
        }],
        data: {}
      }
    }
  }

  async changeCoin(mobile, amount) {
    try{
      let res
      if(!this.token) {
        res = await this.login()
        if(res.status==0) {
          return res
        }
      }

      let body = {
        resident: mobile,
        field_change_value: amount,
      }

      res = await this.req('post', 'update_coin', this.token, body)
      res = await res.json()
      if(res.status==0) {
        if(res.messages[0].code.indexOf('Token')==0) {
          res = await this.login()
          if(res.status==0) {
            return res
          }
          res = await this.req('post', 'update_coin', this.token, body)
          res = await res.json()
        }
      }
      return res
    }catch(e) {
      return {
        status: 0,
        messages: [{
          code: "GamificationConnectionError",
          message: "خطا در اتصال به سرور بازی انگاری",
        }],
        data: {}
      }
    }
  }
}

module.exports = Gamification
