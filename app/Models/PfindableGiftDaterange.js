'use strict'

const Model = use('Model')

class PfindableGiftDaterange extends Model {
  static get table () {
    return 'pfindable_gift_dateranges'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = PfindableGiftDaterange
