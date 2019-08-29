'use strict'

const Setting = use('App/Models/Setting')

const Model = use('Model')

class UserTerefik extends Model {
  static boot () {
    super.boot()
    this.addHook('afterFind', 'UserTerefikHook.filth')
    this.addHook('afterFetch', 'UserTerefikHook.filth')
  }

  static get table () {
    return 'user_terefik'
  }

  async filthy(extraFilth) {
    let settings = await Setting.get()
    console.log('Start Filthing', extraFilth)
    let filth = 1 - this.clean
    console.log('Current Filth', filth)
    let filth_layers = []
    try{
        filth_layers = JSON.parse(this.filth_layers)
    }catch(e){
    }
    console.log('Filth Layers', filth_layers)
    if(filth<1) {
      filth += extraFilth
      let filth_length = Math.min(parseInt(filth * 10), 10)
      let isDif = (filth_length > filth_layers.length)
      let layer_dif_length = filth_length - filth_layers.length, flayer

      while(layer_dif_length > 0) {
          flayer = Math.floor(Math.random() * settings.filth_layer_count) + 1;
          if(filth_layers.indexOf(flayer)<0) {
              filth_layers.push(flayer)
              layer_dif_length--
          }
      }

      this.clean = 1 - Math.min(1, filth)
      if(isDif) {
        this.filth_layers = JSON.stringify(filth_layers)
      }
      console.log('Final clean', this.clean)
      console.log('Final Filth Layers', this.filth_layers)
      await this.save()
      return true
    }

    return false
  }
}

module.exports = UserTerefik
