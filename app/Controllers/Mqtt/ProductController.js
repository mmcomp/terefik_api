'use strict'

const Product = use('App/Models/Product')
const Transaction = use('App/Models/Transaction')
const Property = use('App/Models/Property')

const Setting = use('App/Models/Setting')
const Validations = use('App/Libs/Validations')
const Messages = use('App/Libs/Messages/Messages')
const _ = use('lodash')
class ProductController {
  static async gallonList (params, user) {
    let settings = await Setting.get()


    return [{
      status: 1,
      messages: [],
      data: {
        gasoline_gallon_price: settings.gasoline_gallon_price,
        oil_gallon_price: settings.oil_gallon_price,
        soap_gallon_price: settings.soap_gallon_price,
        water_gallon_price: settings.water_gallon_price,
        coke_gallon_price: settings.coke_gallon_price
      }
    }]
  }

  static async list (params, user) {
    await user.loadMany(['property'])
    let userData = user.toJSON()

    let results = {
      'health': [],
      'clean': [],
      'gasoline': [],
      'water': []
    }

    if(!params || !params.filter) {
      params = {
        filter: [
          {
            type: 'health'
          },
          {
            type: 'clean'
          },
          {
            type: 'gasoline'
          },
          {
            type: 'water'
          }        
        ]
      }
    }

    for (const record of params.filter) {
      if (params.page == 1) {
        params.page = 0
      } else {
        params.page--
        params.page *= params.limit
      }

      let type = record.type

      let random = 'id'
      if (record['random']) {
        random = 'RAND()'
      }
      console.log('Getting ' + type + ' produts')
      let products = await Product.query().where('type', type).where('status', 'active').orderByRaw(random).offset(params.page).limit(params.limit).fetch()
      console.log(products.toJSON())

      for (const product of products.toJSON()) {
        let available = true

        let data = {
          available: true,
          product_id: product.id,
          product_name: product.name,
          description: product.description,
          price: product.price,
          image: product.image
        }

        data['type'] = product.type
        data['count'] = product.count

        data['available'] = available
        results[record.type].push(data)
      }
    }

    return [{
      status: 1,
      messages: [],
      data: results
    }]
  }

  static async buy (params, user) {
    let rules = {
      id: 'required|integer'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let product = await Product.query().where('id', params.id).whereNot('type', 'avatar').first()
    if (!product) {
      return [{
        status: 0,
        messages: Messages.parse(['ProductNotFound']),
        data: {}
      }]
    }
    await user.loadMany(['property', 'level'])
    let userData = user.toJSON()

    let available = true

    if (!available) {
      return [{
        status: 0,
        messages: [{"code":'lowLevel',"message":'هنوز امکان خرید این محصول را ندارید'}], // Messages.parse(['WrongAction']),
        data: {}
      }]
    }

    if (product.price_type == 'coin' && product.price > userData.coin) {
      return [{
        status: 0,
        messages: Messages.parse(['coinNotEnough']),
        data: {}
      }]
    }

    let transaction = new Transaction()
    transaction.user_id = user.id
    transaction.type = 'product'
    transaction.type_id = product.id
    transaction.price_type = 'coin'
    transaction.price = product.price
    transaction.status = 'success'
    await transaction.save()


    product.stat++
    await product.save()

    switch (product.type) {
      case 'health':
        let changes = {}
        changes['health_oil'] = userData.property[product.type] + product.count
        break
      case 'clean':
        let changes = {}
        changes['cleaning_soap'] = userData.property[product.type] + product.count
        break
      case 'gasoline':
        let changes = {}
        changes['gasoline'] = userData.property[product.type] + product.count
        break
      case 'water':
        let changes = {}
        changes['water'] = userData.property[product.type] + product.count
        break
    }

    await user.property().update(changes)
    break

    user.coin = user.coin - product.price
    await user.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }

  static async buyGallon (params, user) {
    let settings = await Setting.get()

    let rules = {
      type: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    if(params.type!='gasoline' && params.type!='health_oil' && params.type!='cleaning_soap' && params.type!='water' && params.type!='coke'){
      return [{
        status: 0,
        messages: [{
          code: "TypeRequired",
          message: "مقدار تایپ صحیح نمی باشد"
        }],
        data: {}
      }]
    }
    
    let userProperty = await Property.query().where('user_id', user.id).first()
    if(!userProperty) {
      return [{
        status: 0,
        messages: [{
          code: "UserNotFound",
          message: "اطلاعات کاربر ناقص می باشد"
        }],
        data: {}
      }]
    }

    if(userProperty.bronze_coin<=0) {
      return [{
        status: 0,
        messages: [{
          code: "ShortOnBronzeCoin",
          message: "سکه نقره شما تمام شده است"
        }],
        data: {}
      }]
    }

    let othetType = params.type
    if(othetType=='health_oil') {
      othetType = 'oil'
    }else if(othetType=='cleaning_soap') {
      othetType = 'soap'
    }

    let neededProperty = 1 - (userProperty[params.type] % 1)
    let price = Math.ceil(settings[othetType+'_gallon_price'] * neededProperty)
    if(userProperty.bronze_coin >= price) {
      userProperty.bronze_coin -= price
      userProperty[params.type] = parseInt(userProperty[params.type], 10) + 1
      await userProperty.save()
    }else {
      userProperty[params.type] += userProperty.bronze_coin / settings[othetType+'_gallon_price']
      userProperty.bronze_coin = 0
      await userProperty.save()
    }

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }
}

module.exports = ProductController
