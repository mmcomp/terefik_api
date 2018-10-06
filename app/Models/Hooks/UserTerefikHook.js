'use strict'

const Setting = use('App/Models/Setting')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const UserTerefikHook = exports = module.exports = {}

UserTerefikHook.filth = async (userTerefiks) => {
    console.log('Cal Filth')
    // console.log(userTerefiks.length, userTerefiks[0].id)
    let userTerefik
    for(let i = 0;i < userTerefiks.length;i++) {
        userTerefik = userTerefiks[i]
    
        let settings = await Setting.get()

        let last_seconds = Time().diff(userTerefik.updated_at, 'seconds')
        console.log('last second', last_seconds, settings.filth_per_second, userTerefik.clean)
        let filth = last_seconds * settings.filth_per_second + (1 - userTerefik.clean)
        console.log('filth', filth)
        let filth_length = Math.min(parseInt(filth * 10), 10)
        console.log('filth length', filth_length)
        let filth_layers = []

        try{
            filth_layers = JSON.parse(userTerefik.filth_layers)
        }catch(e){
        }
        console.log('filth layers', filth_layers)
        let isDif = (filth_length > filth_layers.length)
        let layer_dif_length = filth_length - filth_layers.length, flayer
        console.log('layer_dif_length', layer_dif_length)
        while(layer_dif_length > 0) {
            flayer = Math.floor(Math.random() * settings.filth_layer_count) + 1;
            if(filth_layers.indexOf(flayer)<0) {
                filth_layers.push(flayer)
                layer_dif_length--
            }
        }
        // while(layer_dif_length<0) {
        //     filth_layers.pop()
        //     layer_dif_length++
        // }

        console.log('filth layers', filth_layers)
        userTerefiks[i].clean = 1 - Math.min(1, filth)
        if(isDif) {
            userTerefiks[i].filth_layers = JSON.stringify(filth_layers)
        }
        console.log('saving')
        await userTerefiks[i].save()
    }
}
