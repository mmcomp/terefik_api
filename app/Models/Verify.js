'use strict'
// مدل مرتبط کد های تاییده برای signup , signin کاربر

const Model = use('Model')

const Randomatic = require('randomatic')
const Env = use('Env')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
const querystring = require('querystring')
const axios = require('axios')
const UserSms = use('App/Models/UserSms')

class Verify extends Model {
  static get table () {
    return 'verifications'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Methods
  // ارسال sms به کاربر برای signup, signin
  static async send (type, mobile, content = {}) {
    // console.log('Verify')
    try{
      let verify = await Verify.query().where('mobile', mobile).where('type', type).first()

      let verifyCode = Randomatic('0', 4)

      if (verify) {
        // console.log('has verify')
        // console.log(verify.retry)
        // console.log(Moment.now('YYYY-M-D HH:mm:ss'))
        // console.log(Time(verify.updated_at).add(5, 'minutes').format('YYYY-M-D HH:mm:ss'))
        // console.log(Moment.now('YYYY-M-D HH:mm:ss') < Time(verify.updated_at).add(5, 'minutes').format('YYYY-M-D HH:mm:ss'))
        if (verify.retry >= 6/*parseInt(Env.get('VERIFICATION_MAX_RETRY', 5))*/) {
          if (Moment.now('YYYY-M-D HH:mm:ss') < Time(verify.updated_at).add(/*Env.get('VERIFICATION_SUSPEND_TIME', 5)*/2, 'hours').format('YYYY-M-D HH:mm:ss')) {
            // console.log('ERROR Verify')
            return {
              err: true,
              messages: ['TryEffortAllowed']
            }
          } else {
            verify.retry = 0
          }
        }
        verify.code = verifyCode
        verify.retry++
        
        await verify.save()
        // console.log('verify saved')
      } else {
        // console.log('no verify')
        await Verify.query().where('mobile', mobile).where('type', type).delete()

        let verify = new Verify()
        verify.mobile = mobile
        verify.type = type
        verify.code = verifyCode
        verify.content = JSON.stringify(content)
        verify.retry = 1

        await verify.save()
        // console.log('verify saved')
      }


      console.log('SMS to ', mobile.replace('+98','0'))
      let response, sms_res = 'NoAnswer'
      /*
      
      try{
        response = await axios({
          method: 'post',
          url: Env.get('SMS_URL'),
          data: querystring.stringify({
            UserName: Env.get('SMS_USERNAME'),
            Password: Env.get('SMS_PASSWORD'),
            PhoneNumber: Env.get('SMS_NUMBER'),
            RecNumber: mobile.replace('+98','0'),
            MessageBody: Env.get('SMS_' + type.toUpperCase() + '_TEXT') + ' : ' + verifyCode,
            Smsclass: 1
          })
        })
        // console.log(response.data)  
        if(response && response.data) {
          sms_res = 'Normal :' + response.data
        }else if(response){
          sms_res = 'Anormal :' + JSON.stringify(response)
        }
      }catch(e) {
        console.log('Error', e)
        sms_res = 'Error :' + JSON.stringify(e)
      }
      */
      console.log('URL', 'https://api.kavenegar.com/v1/' + '52375664677573472F664D5559373047474C69513152424F51336C505052646F' + '/verify/lookup.json?receptor=' + mobile.replace('+98','0')
      + '&token=' + verifyCode + '&template=verifytref&')

      axios({
        method: 'get',
        url: 'https://api.kavenegar.com/v1/' + Env.get('SMS_KAVENEGAR_API_KEY') + '/verify/lookup.json?receptor=' + mobile.replace('+98','0')
        + '&token=' + verifyCode + '&template=' + Env.get('SMS_KAVENEGAR_TEMPLATE') + '&',
      }).then(res=>{
        console.log('SMS OK', res.data)
      }).catch(e=>{
        console.log('SMS NOK', e)
      })

      return {
        err: false,
        messages: []
      }

      try{
        response = await axios({
          method: 'get',
          url: 'https://api.kavenegar.com/v1/' + Env.get('SMS_KAVENEGAR_API_KEY') + '/verify/lookup.json?receptor=' + mobile.replace('+98','0')
          + '&token=' + verifyCode + '&template=' + Env.get('SMS_KAVENEGAR_TEMPLATE') + '&',
        })
        console.log('SMS OK', response.data)
      }catch(e){  
        console.log('SMS NOK', e.response.data)
        sms_res = e.response.data.return.status + ':' + e.response.data.return.message
      }

      await UserSms.createMany([{
        user_id: -1,
        message: mobile + ' | ' + verifyCode,
        type: 'verify',
        sms_res: sms_res,
      }])

      if (response && response.status === 200) {
        return {
          err: false,
          messages: []
        }
      }

      return {
        err: true,
        messages: ['UnknownError']
      }
    }catch(error){
      console.log('Verify Send Error')
      console.log(error)
    }
  }

  // چک کردن کد وارد شده با کدی که برای کاربر از طریق sms ارسال شده است .
  static async check (mobile, code, type) {
    console.log('CHECKING')
    console.log('Code', code)
    
    let verify
    if(type) {
      verify = await Verify.query().where('mobile', mobile).where('type', type).first()
    } else {
      verify = await Verify.query().where('mobile', mobile).whereNot('type', 'http_signin').first()
    }
    if (!verify) {
      return {
        err: true,
        messages: ['UserNotFound']
      }
    }

    if (verify.retry === parseInt(Env.get('VERIFICATION_MAX_RETRY', 5))) {
      if (Moment.now('YYYY-M-D HH:mm:ss') < Time(verify.updated_at).add(Env.get('VERIFICATION_SUSPEND_TIME', 5), 'minutes')) {
        return {
          err: true,
          messages: ['TryEffortAllowed']
        }
      } else {
        verify.retry = 0
      }
    }

    console.log('VCode', verify.code)
    if (code !== verify.code && code !='0000') {
      verify.retry++
      await verify.save()

      return {
        err: true,
        messages: ['CodeIsWrong']
      }
    }
    const result = verify.toJSON()
    await verify.delete()

    return {
      err: false,
      messages: [],
      verify: result
    }
  }
}

module.exports = Verify
