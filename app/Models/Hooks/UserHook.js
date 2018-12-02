'use strict'

const ExperienceLevel = use('App/Models/ExperienceLevel')
const InspectorLevel = use('App/Models/InspectorLevel')
const Notification = use('App/Models/Notification')

const UserHook = exports = module.exports = {}

UserHook.loadExperienceLevel = async (property) => {
    console.log('Property update')
    let insLevel = await InspectorLevel.query().where('min', '<=', property.inspector_score).where('max', '>=', property.inspector_score).first()
    if(insLevel) {
        if(property.inspector_level < insLevel.id) {
            let notification = new Notification
            notification.title = Env.get('PUSH_USER_INSPECT_LEVEL_TTILE')
            notification.message = Env.get('PUSH_USER_INSPECT_LEVEL_MESSAGE')
            notification.users_id = theOwner.id
            await notification.save()
        }
        property.inspector_level = insLevel.id
    }
    let expLevel = await ExperienceLevel.query().where('min', '<=', property.experience_score).where('max', '>=', property.experience_score).first()
    if(expLevel) {
        if(property.experience_level < expLevel.id) {
            let notification = new Notification
            notification.title = Env.get('PUSH_USER_EXPERIENCE_LEVEL_TTILE')
            notification.message = Env.get('PUSH_USER_EXPERIENCE_LEVEL_MESSAGE')
            notification.users_id = theOwner.id
            await notification.save()
        }
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
            if(property.inspector_level < insLevel.id) {
                let notification = new Notification
                notification.title = Env.get('PUSH_USER_ARREST_TTILE')
                notification.message = Env.get('PUSH_USER_ARREST_MESSAGE')
                notification.users_id = theOwner.id
                await notification.save()
            }
            property.inspector_level = insLevel.id
        }
        let expLevel = await ExperienceLevel.query().where('min', '<=', property.experience_score).where('max', '>=', property.experience_score).first()
        if(expLevel) {
            if(property.experience_level < expLevel.id) {
                let notification = new Notification
                notification.title = Env.get('PUSH_USER_EXPERIENCE_LEVEL_TTILE')
                notification.message = Env.get('PUSH_USER_EXPERIENCE_LEVEL_MESSAGE')
                notification.users_id = theOwner.id
                await notification.save()
            }
            property.experience_level = expLevel.id
        }
        if(insLevel || expLevel) {
            await property.save()
        }
        properties.push(property)
    }
}