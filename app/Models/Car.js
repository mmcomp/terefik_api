'use strict'

const Database = use('Database')

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

    static async getCarsAround(lon, lat, distance) {
        let sql = "select `vehicle_id`,st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) * 100000  `dis` from `user_vehicle` where st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) < " + String(parseFloat(distance)/100000)
        let results = await Database.raw(sql)
        results = results[0]
        return results
    }

    usercar() {
        return this.hasOne('App/Models/UserCar', 'id', 'vehicle_id')
    }
}

module.exports = Car
