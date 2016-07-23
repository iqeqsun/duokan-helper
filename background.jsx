'use strict'

import _ from 'lodash'
import cheerio from 'cheerio'

let notificationClickedHandlers = {}
  , notificationList = {}

function createNotification(options) {
  return new Promise((resolve, reject) => {
    chrome.notifications.create(options, resolve)
  })
}

async function createDiscountNotification(url, title, current_price, old_price, image_url) {
  if (notificationList[url]) {
    return
  }
  let id = await createNotification({
    type: 'basic'
  , iconUrl: image_url
  , title: `《${title}》已降价${Math.round((old_price - current_price) / old_price * 100)}%`
  , message: `原价: ${old_price.toFixed(2)}元 现价: ${current_price.toFixed(2)}元`
  , contextMessage: `来自 多看助手`
  })
  notificationList[url] = id
  notificationClickedHandlers[id] = () => chrome.tabs.create({url})
}

function checkPrice() {
  chrome.storage.local.get('local', ({local}) => {
    if (local && local.fav && local.fav.list && local.paidList) {
      let fav = local.fav.list
        , paid = local.paidList
        , favUnpaid = _(fav)
          .filter(book => !_.some(paid, paid_book => book.id === paid_book.id))
          .map(({title, price, url, cover}) => ({title, price, url, cover}))
          .value()
      _.each(favUnpaid, (book, i) => {
        _.delay(() => {
          fetch(`http://www.duokan.com${book.url}`)
          .then(response => response.text())
          .then(body => {
            let $ = cheerio.load(body)
              , price = $('.price em').text()
            if (price == '免费') {
              price = 0
            } else {
              price = Number(_.first(price.match(/[\d.]+/)))
            }
            if (price < book.price) {
              createDiscountNotification(`http://www.duokan.com${book.url}`, book.title, price, book.price, book.cover)
            }
          })
        }, 3000 * i)
      })
    }
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'fontList':
      chrome.fontSettings.getFontList(callback => {
        sendResponse({ fontList: callback })
      })
      break
    case 'localStorage':
      let local = request.data.local
      if (local) {
        local = JSON.parse(local)
        chrome.storage.local.set({ local }, sendResponse)
      }
      break
    default:
  }
  return true
})

chrome.runtime.onStartup.addListener(checkPrice)

chrome.alarms.onAlarm.addListener(({name}) => {
  let jobs = { checkPrice }
  jobs[name]()
})

chrome.notifications.onClosed.addListener(notificationId => {
  Object.keys(notificationList).forEach(key => {
    if (notificationList[key] === notificationId) {
      notificationList[key] = false
    }
  })
})

chrome.notifications.onClicked.addListener(notificationId => {
  let handler = notificationClickedHandlers[notificationId]
  if (handler) {
    handler()
    chrome.notifications.clear(notificationId)
      notificationClickedHandlers[notificationId] = null
  }
})

chrome.alarms.create('checkPrice', {periodInMinutes: 120})

checkPrice()
