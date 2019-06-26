'use strict'

const Env = use('Env')
const mqttclient = require('mqtt')
const responseClass = require('./fast')

let fastclient = mqttclient.connect(Env.get('SERVER_MQTT'), {
  username: Env.get('FAST_USERNAME'),
  password: Env.get('FAST_PASSWORD'),
  clientId: Env.get('FAST_CLIENT')
})
fastclient.on('connect', function () {
  fastclient.subscribe(Env.get('FAST_SENDER_TOPIC'))
  console.log('FAST MQTT connected ...')
})
fastclient.on('message', async function(topic, message) {
  console.log('FAST Message:', message.toString())
  try{
    message = JSON.parse(message)
  }catch(e){
    console.log('FAST MQTT: Error in Message')
    console.log(e)
    message = null
  }
  if(message) {
    try{
      let user_id = await responseClass.loadUser(message.client_id, message.token)
      const is_parking_ranger = user_id[0].is_parking_ranger
      const last_daily_gift = user_id[0].last_daily_gift
      user_id = user_id[0].id
      console.log('FAST MQTT: User ID',user_id)
      const theResponse = new responseClass(user_id, is_parking_ranger, last_daily_gift)
      console.time('ReqTime')
      let output = await theResponse[message.type](message.data)
      console.timeEnd('ReqTime')
      if(output.error) {
        output = {
          status: 0,
          messages: [output.error],
          data: {},
          type: message.type,
        }
      }else {
        output = {
          status: 1,
          messages: [],
          data: output,
          type: message.type,
        }
      }
      fastclient.publish(`client_${ message.token }/${ message.type }`, JSON.stringify(output))
      console.log('Exec', message.type)
      console.log(JSON.stringify(output))
    }catch(e){
      console.log('FAST MQTT: User Error')
      console.log(e)
    }
  }
})
fastclient.on('error', function(err) {
  console.log('FAST MQTT ERROR', err)
})
