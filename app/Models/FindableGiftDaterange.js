'use strict'

const Model = use('Model')

class FindableGiftDaterange extends Model {
  static get table () {
    return 'findable_gift_dateranges'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = FindableGiftDaterange
