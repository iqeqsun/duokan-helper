'use strict'

import _ from 'lodash'
import qwest from 'qwest'

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

function CreateInfoElement(text) {
  let info = document.createElement('i')
  info.textContent = text
  return info
}

function Log(title = null) {
  if (title === null) {
    return console.log.bind(console)
  }
  return (obj) => {
    if (_.isString(obj)) {
      console.log(`${title}: ${obj}`)
    } else {
      console.log(`${title}:`)
      console.log(obj)
    }
  }
}

function GetMinTimeline(timelines) {
  _.each(timelines, (timeline) => {
    timeline.Price = Number(timeline.Price)
  })
  return _.reduceRight(timelines, (min, timeline) => min.Price > timeline.Price ?
    timeline : min)
}

function GetMinPrice(timelines) {
  return GetMinTimeline(timelines).Price
}

function BookHandler(pathname) {
  let id = pathname[1]
  if (!StrIsNumber(id)) {
    return
  }
  GetBookPromise(id).then((xhr, timelines) => {
    let min = GetMinTimeline(timelines)
    let price = min.Price
    let time = new Date(min.Timestamp * 1000)
    let year = time.getFullYear()
    let month = `0${time.getMonth() + 1}`.substr(-2)
    let day = `0${time.getDate()}`.substr(-2)
    let info = CreateInfoElement(
      `于${year}-${month}-${day}为最低价 ¥ ${price}`)
    document.querySelector('.price').appendChild(info)
  }).catch(ErrorHandler)
}

function FavouriteHandler() {
  new MutationObserver((mutations) => {
    _(mutations)
      .map(mutation => mutation.addedNodes)
      .filter(nodes => nodes.length > 0)
      .map(_.toArray)
      .flatten()
      .uniq()
      .filter(node => node.querySelectorAll)
      .map(node => _.toArray(node.querySelectorAll(
        'a.title[href^="/book/"]')))
      .flatten()
      .each((a) => {
        let pathname = Pathname2Array(a.pathname)
        let id = pathname[1]
        if (!StrIsNumber(id)) {
          return
        }
        GetBookPromise(id).then((xhr, timelines) => {
          let min_price = GetMinPrice(timelines)
          let info = CreateInfoElement(`历史最低: ¥ ${min_price}`)
          a.parentElement.appendChild(info)
        }).catch(ErrorHandler)
      })
      .run()
  }).observe(document.body, {
    childList: true,
    subtree: true
  })
}

let pathname = Pathname2Array(new URL(document.URL).pathname)

let handler = {
  'book': BookHandler,
  'favourite': FavouriteHandler
}

if (_.first(pathname) === 'u') {
  pathname.shift()
}

handler[_.first(pathname)](pathname)
