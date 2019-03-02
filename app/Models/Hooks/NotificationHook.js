'use strict'

const axios = require('axios')
const Env = use('Env')
const User = use('App/Models/User')

const NotificationHook = exports = module.exports = {}

NotificationHook.send = async (notification) => {
    let response
    console.log('Sending PUSH')
    try{
        let data = {
            "applications": [Env.get('PUSH_PACKAGE')],
            "notification": {
            "title": notification.title,
            "content": notification.message,
            "action": {
                "url": "",
                "action_type": "A"
            }
            }
        }
        if(notification.type === 'user_arrest') {
            data['notification']['icon'] = Env.get('PUSH_USER_ARREST_ICON')
        }
        if(notification.users_id>0) {
            console.log('User ID = ', notification.users_id)
            let theUser = await User.query().where('id', notification.users_id).first()
            if(theUser) {
                console.log('Pushe Id ', theUser.pushe_id)
                if(theUser.pushe_id && theUser.pushe_id!='') {
                    data['filter'] = {
                        pushe_id: [theUser.pushe_id]
                    }

                    console.log('Push Data')
                    console.log(data)
                    axios.defaults.baseURL = Env.get('PUSH_URL')
                    axios.defaults.timeout = 1000
                    axios.defaults.headers.common['Authorization'] = 'Token ' + Env.get('PUSH_TOKEN')
                    axios.defaults.headers.post['Content-Type'] = 'application/json'
                    axios.defaults.headers.post['Accept'] = 'application/json'
                    response = await axios.post('', data)
                    console.log('Push response')
                    console.log(response.data)
                }
                let pubTopic = 'client_' + theUser.token + '/ArrestNotification'
                let data = {}
                try{
                    data = JSON.parse(notification.data)
                }catch(e) {

                }
                let messageData = {
                    status: 1,
                    messages: [],
                    data: {
                        message: notification.message,
                        loot: data,
                    },
                    type: 'ArrestNotification',
                }

                Mqtt.publish(pubTopic, JSON.stringify(messageData))
                console.log('Sent Arrent Mqtt Notification ')
                console.log(theUser.mobile ,messageData)
            }else {
                return false
            }
        }
        return response.data
    }catch(e) {
        return false
    }
}
