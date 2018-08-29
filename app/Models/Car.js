'use strict'

const Model = use('Model')

class Car extends Model {
    static get table () {
        return 'vehicle'
    }

    static get createdAtColumn () {
        return 'created_at'
    }

    static get updatedAtColumn () {
        return 'updated_at'
    }
}

module.exports = Car
