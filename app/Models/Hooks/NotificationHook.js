'use strict'

const axios = require('axios')
const Env = use('Env')
const User = use('App/Models/User')

const NotificationHook = exports = module.exports = {}

NotificationHook.send = async (notification) => {
    async function readClients(username, password, url, page_size) {
        try {
          if(typeof page_size=='undefined') {
            page_size = 20
          }
          let current_page = 1, clients = []
          let firstRead = await axios.get(`${url}?curr_page=${current_page}&page_size=${page_size}`, {auth: {
              username: username,
              password: password,
            }
          })
          firstRead = firstRead.data
          if(firstRead.code==0) {
            current_page++
            clients = firstRead.result.objects
            if(page_size<firstRead.result.total_num) {
              let readRecords = page_size
              let total_num = firstRead.result.total_num, nextRead
              while(readRecords<total_num) {
                nextRead = await axios.get(`${url}?curr_page=${current_page}&page_size=${page_size}`, {auth: {
                    username: username,
                    password: password,
                  }
                })
                nextRead = nextRead.data
                if(nextRead.code!=0) {
                  break
                }
                readRecords+=nextRead.result.objects.length
                clients = clients.concat(nextRead.result.objects)
                current_page++
              }
            }
          }
          return clients
        }catch(e) {
          console.log('Error Happend', e)
          return []
        }
    }

    let response, pusheData = {
        applications: [Env.get('PUSH_PACKAGE')],
        notification: {
            title: notification.title,
            content: notification.message,
            action: {
                url: "",
                action_type: "A"
            }
        }
    }
    console.log('Sending PUSH')
    try{
        if(notification.type === 'user_arrest') {
            pusheData.notification['icon'] = Env.get('PUSH_USER_ARREST_ICON')
        }
        if(notification.users_id>0) {
            console.log('User ID = ', notification.users_id)
            let theUser = await User.query().where('id', notification.users_id).first()
            if(theUser) {
                console.log('Pushe Id ', theUser.pushe_id)
                if(theUser.pushe_id!='') {
                    pusheData['filter'] = {
                        pushe_id: [theUser.pushe_id]
                    }

                    console.log('Push Data')
                    console.log(pusheData)

                    response = /*await*/ axios({
                        method: 'POST',
                        headers: {
                            'Authorization': 'Token ' + Env.get('PUSH_TOKEN'),
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        url : Env.get('PUSH_URL'), 
                        data: pusheData,
                    })
                    // console.log('Push response')
                    // console.log(response.data)
                }
                let onLineClients = await readClients(Env.get('EMQTT_DASHBOARD_USER'), Env.get('EMQTT_DASHBOARD_PASSWORD'), Env.get('EMQTT_API_CLIENTS'), 1000)
                let isOnline = false
                for(let cli of onLineClients) {
                    if(cli.username==theUser.mobile) {
                        isOnline = true
                    }
                }
                if(isOnline) {
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
                        type: (notification.type === 'user_arrest')?'ArrestNotification':notification.type,
                    }

                    Mqtt.publish(pubTopic, JSON.stringify(messageData))
                    if(notification.type === 'user_arrest') {
                        console.log('Sent Arrent Mqtt Notification ')
                    }else {
                        console.log('Sent ' + notification.type + ' Mqtt Notification ')
                    }
                    console.log(theUser.mobile ,messageData)
                    Notification.query().where('id', notification.id).update({
                        status: 'sent',
                    })
                }
            }else {
                return false
            }
        }
        return response.data
    }catch(e) {
        console.log('Notification Send Hook Error')
        console.log(e)
        return false
    }
}
