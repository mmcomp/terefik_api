'use strict'

const Fetch = require("node-fetch")

let body = {
  email: 'amirkheirabadi.com@gmail.com',
  password: '123456',
}
let method = 'post', token = null, func = 'login'

let options = {
  method: (method && method!='')?method:'get',
  headers: { 'Content-Type': 'application/json' },
}
if(body && method=='post') {
  options['body'] = JSON.stringify(body)
}
if(token) {
  options['headers']['Authorization'] = 'Bearer ' + token
}
Fetch('http://gamification/api/' + func, options).then(res => res.json())
.then(json => console.log(json))


// function login() {
//   let body = {
//     email: 'amirkheirabadi.com@gmail.com',
//     password: '123456',
//   }
//   return new Promise(function(resolve, reject) {
//     req(null, 'login', null, body)
//     resolve(res)
//   })
// }

// login().then((res) => {
//   console.log('Response', res)
// });