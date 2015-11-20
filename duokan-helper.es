'use strict'

import * as _ from 'lodash'
import * as qwest from 'qwest'

const API = 'http://127.0.0.1:8080'

function Pathname2Array(s) {
  return _.rest(s.split('/'))
}

function StrIsNumber(v) {
  return /^\d+$/.test(v)
}

function ErrorHandler(e) {
  console.error(e)
}

function GetBookPromise(id) {
  return qwest
    .get(`${API}/book/${id}`)
    .catch(ErrorHandler)
}

function GetMinPrice(timelines) {
  _.each(timelines, (timeline) => {
    timeline.Price = Number(timeline.Price)
  })
  return _.reduce(timelines, (min, timeline) => {
    return min.Price > timeline.Price ? timeline : min
  }).Price
}

let pathname = Pathname2Array(new URL(document.URL).pathname)

if (_.first(pathname) === 'book') {
  (() => {
    let id = pathname[1]
    if (!StrIsNumber(id)) {
      return
    }
    GetBookPromise(id).then((xhr, timelines) => {
      let min_price = GetMinPrice(timelines)
      let i = document.createElement('i')
      i.textContent = `历史最低价¥ ${min_price}`
      document.querySelector('.price').appendChild(i)
    }).catch(ErrorHandler)
  })()
}

_.each(document.querySelectorAll('a.title[href^="/book/"]'), (a) => {
  let pathname = Pathname2Array(a.pathname)
  let id = pathname[1]
  if (!StrIsNumber(id)) {
    return
  }
  GetBookPromise(id).then((xhr, timelines) => {
    let min_price = GetMinPrice(timelines)
    let i = document.createElement('i')
    i.textContent = `历史最低价¥ ${min_price}`
    a.parentElement.appendChild(i)
  }).catch(ErrorHandler)
})
