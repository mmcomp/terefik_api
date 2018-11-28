'use strict'

const ExperienceLevel = use('App/Models/ExperienceLevel')
const InspectorLevel = use('App/Models/InspectorLevel')

const UserHook = exports = module.exports = {}

UserHook.loadExperienceLevel = async (property) => {
    console.log('Property update')
    let insLevel = await InspectorLevel.query().where('min', '<=', property.inspector_score).where('max', '>=', property.inspector_score).first()
    if(insLevel) {
        property.inspector_level = insLevel.id
    }
    let expLevel = await ExperienceLevel.query().where('min', '<=', property.experience_score).where('max', '>=', property.experience_score).first()
    if(expLevel) {
        property.experience_level = expLevel.id
    }
    if(insLevel || expLevel) {
        await property.save()
    }
}


UserHook.loadExperienceLevels = async (properties) => {
    console.log('Properties update')
    let tmp = properties
    properties = []
    for(let property of tmp) {
        let insLevel = await InspectorLevel.query().where('min', '<=', property.inspector_score).where('max', '>=', property.inspector_score).first()
        if(insLevel) {
            property.inspector_level = insLevel.id
        }
        let expLevel = await ExperienceLevel.query().where('min', '<=', property.experience_score).where('max', '>=', property.experience_score).first()
        if(expLevel) {
            property.experience_level = expLevel.id
        }
        if(insLevel || expLevel) {
            await property.save()
        }
        properties.push(property)
    }
}