'use strict'

const Helpers = use('Helpers')
const fs = use('fs')
const readFile = Helpers.promisify(fs.readFile)

const User = use('App/Models/User')
const UserTerefik = use('App/Models/UserTerefik')
const ParkingRangerDoc = use('App/Models/ParkingRangerDoc')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class FileController {
  async upload ({
    request,
    response
  }) {
    console.log('File Upload Started')
    try{
      if(!request.file('the_file') || !request.all()['mobile'] || !request.all()['token']) {
        console.log('InputError')
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
        console.log('MobileNotCurrect')
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
      } else if(doc_type!='arrest' && doc_type!='texture') {
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
      }else if(doc_type=='texture') {
        if(request.all()['terefiki_id']) {
          let userTrefik = await UserTerefik.find(request.all()['terefiki_id'])
          if(!userTrefik) {
            return response.status(400).send({
              status: 0,
              messages: [{
                code: 'TerefikNotFound',
                message: 'ترفیکی مورد نظر یافت نشد'
              }],
              data: {}
            })
          }
          userTerefik.body_texture = filename
          userTrefik.body_texture_time = Moment.now('YYYY-MM-DD HH:mm:ss')
          await userTrefik.save();          
        }
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
      console.log(request.method())
      console.log('Params')
      console.log(params)
      if(!params || !params.filename) {
        response.header('Error', 'FilenameNeeded')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'FilenameNeeded',
            message: 'ورود نام فایل الزامی است'
          }],
          data: {}
        })
      }
      let filePath = Helpers.appRoot() + '/tmp/uploads/' + params.filename
      if (!fs.existsSync(filePath)) {
        response.header('Error', 'FileNotFound')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'FileNotFound',
            message: 'فایل مورد نظر پیدا نشد'
          }],
          data: {}
        })
      }

      if(request.method()=='GET') {
        console.log('Reading ' + filePath)
        let contents = await readFile(Helpers.appRoot() + '/tmp/uploads/' + params.filename)
        response.header('File-Updated-At', Moment.now('YYYY-MM-DD HH:mm:ss'))
        return response.send(contents)  
      }else if(request.method()=='HEAD') {
        console.log('Head request')
        let userTrefik = await UserTerefik.query().where('body_texture', params.filename).first()
        if(!userTrefik) {
          console.log('Terefiki not found')
          response.header('Error', 'TerefikiNotFound')
          return response.status(400).send({
            status: 0,
            messages: [{
              code: 'TerefikiNotFound',
              message: 'ترفیکی مورد نظر پیدا نشد'
            }],
            data: {}
          })
        }
        console.log('Adding to Header')
        response.header('File-Updated-At', userTrefik.body_texture_time)
        return response.status(200)
      }
    }catch(e){
      console.log(e)
      return response.status(400).send({
        status: 0,
        messages: [{
          code: 'FileDownloadError',
          message: 'دریافت فایل با مشکل مواجه شد'
        }],
        data: {}
      })
    }
  }
}

module.exports = FileController
