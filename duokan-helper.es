'use strict'

import _ from 'lodash'
import qwest from 'qwest'
import react from 'react'

const API = 'http://127.0.0.1:8080'
const KEY = Symbol('duokan-helper')

const PASS = () => {}

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
  return qwest.get(`${API}/book/${id}`)
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

function GetCookie(name) {
  let value = '; ' + document.cookie
  let parts = value.split('; ' + name + '=')
  if (parts.length == 2) {
    return parts.pop().split(';').shift();
  }
}

function GetFavsPromise(start = 0, count = 10) {
  let _t = parseInt(new Date().getTime() / 1e3)
  let _c = `${GetCookie('device_id')}&${_t}`.split('').reduce((t, n) => (131 *
    t + n.charCodeAt(0)) % 65536, 0)
  return new Promise((resolve, reject) => {
    qwest.post('http://www.duokan.com/discover/user/fav/list_favs', {
        type: 0,
        start,
        count,
        _t,
        _c
      })
      .then((xhr, response) => resolve(JSON.parse(response)))
      .catch(reject)
  })
}

function GetBookIdPromise(source_id) {
  return new Promise((resolve, reject) => {
    qwest.get(`http://www.duokan.com/hs/v0/android/store/book/${source_id}`)
      .then((xhr, response) => resolve(response.item))
      .catch(reject)
  })
}

function GetWishPromise() {
  return new Promise((resolve, reject) => {
    GetFavsPromise()
      .then(({
        total
      }) => {
        let count = 30
        let ps = []
        for (let i = 0; i < total; i += count) {
          ps.push(GetFavsPromise(i, count))
        }
        return ps
      })
      .then(ps => Promise.all(ps))
      .then(data =>
        _(data)
        .map(({
          data
        }) => data)
        .flatten()
        .value()
      )
      .then(books => {
        let t = _.map(books, ({
          source_id
        }) => GetBookIdPromise(source_id))
        return t
      })
      .then(ps => Promise.all(ps))
      .then(resolve)
      .catch(reject)
  })
}

function AElementHandler(a) {
  if (a.parentElement[KEY]) {
    return
  }
  let pathname = Pathname2Array(a.pathname)
  let id = pathname[1]
  if (!StrIsNumber(id)) {
    return
  }
  GetBookPromise(id).then((xhr, timelines) => {
      let min_price = GetMinPrice(timelines)
      let info = CreateInfoElement(`历史最低: ¥ ${min_price}`)
      a.parentElement.style.overflow = 'visible'
      a.parentElement.appendChild(info)
      a.parentElement[KEY] = true
    })
    .catch(ErrorHandler)
}

function CommonHandler() {
  _.each(document.querySelectorAll('a.title[href^="/book/"]'), AElementHandler)
}

function BookHandler(pathname) {
  let id = pathname[1]
  if (!StrIsNumber(id)) {
    return
  }
  GetBookPromise(id).then((xhr, timelines) => {
      let parentElement = document.querySelector('.price')
      if (parentElement[KEY]) {
        return
      }
      let min = GetMinTimeline(timelines)
      let price = min.Price
      let time = new Date(min.Timestamp * 1000)
      let year = time.getFullYear()
      let month = `0${time.getMonth() + 1}`.substr(-2)
      let day = `0${time.getDate()}`.substr(-2)
      let info = CreateInfoElement(
        `于${year}-${month}-${day}为最低价 ¥ ${price}`)
      parentElement.appendChild(info)
      parentElement[KEY] = true

    })
    .catch(ErrorHandler)
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
      .each(AElementHandler)
      .run()
  }).observe(document.body, {
    childList: true,
    subtree: true
  })
}

let pathname = Pathname2Array(new URL(document.URL).pathname)

let handler = {
  book: BookHandler, // 单页
  favourite: FavouriteHandler, // 收藏
  special: CommonHandler, // 专题
  r: CommonHandler, // 畅销榜
  list: CommonHandler // 分类
}

if (_.first(pathname) === 'u') {
  pathname.shift()
}

(handler[_.first(pathname)] || PASS)(pathname)
