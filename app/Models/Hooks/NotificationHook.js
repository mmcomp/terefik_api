'use strict'

const axios = require('axios')
const Env = use('Env')
const User = use('App/Models/User')

const NotificationHook = exports = module.exports = {}

NotificationHook.send = async (notification) => {
    let response
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
            let theUser = await User.query().where('id', notification.users_id).first()
            if(theUser) {
                if(theUser.pushe_id && theUser.pushe_id!='') {
                    data['filter'] = [theUser.pushe_id]
                }else{
                    return false
                }
            }else {
                return false
            }
        }

        axios.defaults.baseURL = Env.get('PUSH_URL')
        axios.defaults.timeout = 1000
        axios.defaults.headers.common['Authorization'] = 'Token ' + Env.get('PUSH_TOKEN')
        axios.defaults.headers.post['Content-Type'] = 'application/json'
        axios.defaults.headers.post['Accept'] = 'application/json'
        response = await axios.post('', data)
        return response.data
    }catch(e) {
        return false
    }
}
