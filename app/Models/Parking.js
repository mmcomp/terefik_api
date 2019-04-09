'use strict'

const Database = use('Database')

const Model = use('Model')

class Parking extends Model {
  static async getParkingsAround(lon, lat, distance) {
    // let sql = "select `vehicle_id`,st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) * 100000  `dis`, `shield_start`, `shield_duration`, `lon`, `lat` from `user_vehicle` where st_distance(point(lon, lat), point(" + lon + ", " + lat + ")) < " + String(parseFloat(distance)/100000)
    let sql = "select glength(LineStringFromWKB(LineString(GeomFromText(astext(PointFromWKB(POINT(lon,lat)))),GeomFromText(astext(PointFromWKB(POINT(" + lon + ", " + lat + "))))))) * 100000  `dis`, `lon`, `lat`, `name`, `online_capacity`, `capacity`, `minimum_reserve_minutes`, `reserve_bronze_coin` from `parkings` where glength(LineStringFromWKB(LineString(GeomFromText(astext(PointFromWKB(POINT(lon,lat)))),GeomFromText(astext(PointFromWKB(POINT(" + lon + ", " + lat + "))))))) < " + String(parseFloat(distance)/100000);
    console.log('Parkings Around Query')
    console.log(sql)
    let results = await Database.raw(sql)
    results = results[0]
    return results
  }
}

module.exports = Parking
