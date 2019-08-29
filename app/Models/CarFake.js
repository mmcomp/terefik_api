'use strict'

const Database = use('Database')

const Model = use('Model')

class CarFake extends Model {
    static get table () {
        return 'vehicle_report'
    }

    static get createdAtColumn () {
        return 'created_at'
    }

    static get updatedAtColumn () {
        return 'updated_at'
    }
}

module.exports = CarFake
