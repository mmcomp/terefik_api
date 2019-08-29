'use strict'

const {
  validate
} = use('Validator')
const _ = require('lodash')
const phone = require('phone')
const vmessages = require('./Messages/ValidationMessages')

class Validaitons {
  // چک کردن داده های ورودی همراه با قوانین ورود و valida کردن داده ها
  static async check (inputs, rules) {
    // console.log('Validate ', inputs, rules)
    const validation = await validate(inputs, rules)//, vmessages)

    if (validation.fails()) {
      // console.log('Validate Fails')
      let messages = []

      _.each(validation.messages(), msg => {
        // console.log('Validate msg', msg)
        messages.push({
          code: msg.field + ' ' + msg.validation,
          message: msg.message
        })
      })
      if(messages.length>0){
        return {
          err: true,
          messages: messages
        }
      }
    }

    return {
      err: false,
      messages: []
    }
  }
  
  // انجام عملیات normalize بروی شماره موبایل وارد شده
  static async normalizeMobile (mobile, country = 'IR') {
    const normalMobile = phone(mobile, country)

    if (normalMobile.length) {
      return normalMobile
    }

    return false
  }
}

module.exports = Validaitons
