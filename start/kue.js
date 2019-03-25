'use strict'

// این فایل از kue که یک تسک منیجر است به منظور عملیات های مرتبط به آمار ها که هر شب سر یک ساعت مشخص باید داده ذخیره شود استفاده می کند
// مشابه cronjob

// Jobs
const DashboardStat = use('App/Jobs/DashboardStat')

try {
  const kue = require('kue-scheduler')
  const Queue = kue.createQueue()

  Queue.remove({
    unique: 'terefiki_dashboard'
  }, function (error, response) {
    if (error) {
      console.log(error, response)
    }
  })

  Queue.remove({
    unique: 'terefiki_stat'
  }, function (error, response) {
    if (error) {
      console.log(error, response)
    }
  })

  Queue.remove({
    unique: 'parkings'
  }, function (error, response) {
    if (error) {
      console.log(error, response)
    }
  })

  // DashboardStat Cron Workder
  const statJob = Queue.createJob('terefiki_stat')
    .attempts(3)
    .priority('normal')

  Queue.every('10 0 * * *', statJob)
  Queue.process('terefiki_stat', DashboardStat.stat)

  // Dashboard Cron Workder
  const dashboardJob = Queue.createJob('terefiki_dashboard')
    .attempts(3)
    .priority('normal')

  Queue.every('20 minutes', dashboardJob)
  Queue.process('terefiki_dashboard', DashboardStat.dashboard)

  // Parking Cron Workder
  const parkingJob = Queue.createJob('parkings')
    .attempts(3)
    .priority('normal')

  Queue.every('5 minutes', parkingJob)
  Queue.process('parkings', DashboardStat.updateParkings)

} catch (error) {
  // SentryException.captureException(error)
  console.log('Workers Error', error)
}

console.log('Start worker ...')
