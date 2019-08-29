'use strict'

const Model = use('Model')

class ParkingRangerDoc extends Model {
    static get table () {
        return 'parking_ranger_docs'
    }

    static get createdAtColumn () {
        return 'created_at'
    }

    static get updatedAtColumn () {
        return 'updated_at'
    }
}

module.exports = ParkingRangerDoc
