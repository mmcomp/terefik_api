'use strict'

const Helpers = use('Helpers')
const fs = use('fs')
const readFile = Helpers.promisify(fs.readFile)

const User = use('App/Models/User')

const ParkingRangerDoc = use('App/Models/ParkingRangerDoc')

class FileController {
  async upload ({
    request,
    response
  }) {
    try{
      if(!request.file('the_file') || !request.all()['mobile'] || !request.all()['token']) {
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'InputError',
            message: 'داده های ورودی کافی نمی باشد'
          }],
          data: {}
        })
      }
  
      if(request.all()['mobile'].indexOf('9')!=0 && request.all()['mobile'].indexOf('09')!=0 && request.all()['mobile'].indexOf('+989')!=0) {
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'MobileNotCurrect',
            message: 'شماره موبایل صحیح نمی باشد'
          }],
          data: {}
        })
      }
      
      if(request.all()['mobile'].indexOf('9')==0) {
        request.all()['mobile'] = '0' + request.all()['mobile']
      }
  
      let user = await User.query().where('mobile', request.all()['mobile']).where('token', request.all()['token']).first()
      if(!user) {
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'UserNotFound',
            message: 'کاربری شما معتبر نمی باشد'
          }],
          data: {}
        })
      }
  
      let doc_type = (request.all()['doc_type'])?request.all()['doc_type']:'profile'

      const profilePic = request.file('the_file', {
        types: ['image'],
        size: '2mb'
      })
  
      let filename = User.getToken()
      let ext = profilePic.clientName.split('.')[profilePic.clientName.split('.').length-1]
      filename = filename + '.' + ext

      await profilePic.move(Helpers.tmpPath('uploads'), {
        name: filename
      })
  
      if (!profilePic.moved()) {

        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'UploadError',
            message: 'ارسال تصویر با مشکل مواجه شد'
          }],
          data: {}
        })
      }
  
      if(doc_type=='profile') {
        user.image_path = filename
        await user.save()
      } else if(doc_type!='arrest') {
        let parkingRangerDoc = await ParkingRangerDoc.query().where('doc_type', doc_type).where('users_id', user.id).first()

        if(parkingRangerDoc) {
          parkingRangerDoc.details = (request.all()['details'])?request.all()['details']:''
          parkingRangerDoc.file_path = filename
        } else {
          parkingRangerDoc = new ParkingRangerDoc
          parkingRangerDoc.doc_type = doc_type
          parkingRangerDoc.details = (request.all()['details'])?request.all()['details']:''
          parkingRangerDoc.file_path = filename
          parkingRangerDoc.users_id = user.id  
        }

        await parkingRangerDoc.save()
      }

      return response.send({
        status: 1,
        messages: [],
        data: {
          image_path: filename
        }
      })
    }catch(e) {
      console.log(e)
      return response.status(400).send({
        status: 0,
        messages: [{
          code: 'UploadError',
          message: 'ارسال تصویر با مشکل مواجه شد'
        }],
        data: {}
      })
    }
  }

  async download ({
    request,
    response,
    params
  }) {
    try{
      console.log('Params')
      console.log(params)
      console.log('Reading ' + Helpers.appRoot() + '/tmp/uploads/' + params.filename)
      let contents = await readFile(Helpers.appRoot() + '/tmp/uploads/' + params.filename)
      return response.send(contents)
    }catch(e){
      console.log('Global Error')
      console.log(e)
      return 'Error'
    }
  }
}

module.exports = FileController
