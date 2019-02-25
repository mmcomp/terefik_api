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
        // let sql = "select `vehicle_id`,st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) * 100000  `dis`, `shield_start`, `shield_duration`, `lon`, `lat` from `user_vehicle` where st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) < " + String(parseFloat(distance)/100000)
        let sql = "select `vehicle_id`,glength(LineStringFromWKB(LineString(GeomFromText(astext(PointFromWKB(POINT(lon,lat)))),GeomFromText(astext(PointFromWKB(POINT(" + lon + ", " + lat + "))))))) * 100000  `dis`, `shield_start`, `shield_duration`, `lon`, `lat`, `leave_time` from `user_vehicle` where glength(LineStringFromWKB(LineString(GeomFromText(astext(PointFromWKB(POINT(lon,lat)))),GeomFromText(astext(PointFromWKB(POINT(" + lon + ", " + lat + "))))))) < " + String(parseFloat(distance)/100000);
        console.log('Cars Around Query')
        console.log(sql)
        let results = await Database.raw(sql)
        results = results[0]
        return results
    }

    usercar() {
        return this.hasOne('App/Models/UserCar', 'id', 'vehicle_id')
    }
}

module.exports = Car
