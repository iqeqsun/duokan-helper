'use strict'

import 'babel-polyfill'
import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import leven from 'leven'
import ChromePromise from 'chrome-promise'

import Components from './Components.es'
import {KEY, BASEPATH, COLOR, PASS, id} from './Common.es'

const chrome = new ChromePromise()

function status(response) {
  if (response.status >= 200 && response.status) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json()
}

function serialize(obj) {
  return _.map(_.keys(obj), key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&')
}

function pathname2Array(s) {
  return _.rest(s.split('/'))
}

function errorHandler(err) {
  throw err
}

function getBookPromise(id) {
  return fetch(`${BASEPATH}/book/${id}`)
    .then(status)
    .then(json)
    .catch(errorHandler)
}

function createInfoElement(text, pricerange = COLOR.NONE) {
  return createElementByReact(<i data-pricerange={pricerange} style={{color: pricerange}}>{text}</i>)
}

function createElementByReact(jsx) {
  let div = document.createElement('div')
  ReactDOM.render(jsx, div)
  return div.children[0]
}

function renderReactElement(jsx, container = 'div') {
  if (_.isString(container)) {
    container = document.createElement(container)
  }
  ReactDOM.render(jsx, container)
  return container
}

function createDoubanLink(title, url = `https://book.douban.com/subject_search?search_text=${encodeURIComponent(title)}`) {
  return createElementByReact(<diV><a href={url} target="_blank">到豆瓣看 {title} 的评价</a></diV>)
}

function createDoubanRating(rating) {
  if (rating === '0.0') {
    return createElementByReact(<span>豆瓣无人评价此书</span>)
  } else {
    return createElementByReact(<span>豆瓣评分: {rating}</span>)
  }
}

function createAmazonLink(title) {
  return createElementByReact(<div><a href={`http://www.amazon.cn/s/${encodeURIComponent(title)}`} target="_blank">到亚马逊找 {title} </a></div>)
}

function aElementsHandler(elements) {
  return new Promise((resolve, reject) => {
    if(elements.length === 0) {
      return
    }
    let obj = _.map(elements, getIdFromA)
      , ids = _.pluck(obj, 'id')
      , as = _.pluck(obj, 'a')
    getBookPromise(ids.join(',')).then(books => {
      for(let i in books) {
        if(books[i] === null) {
          continue
        }
        let min_price = Number(books[i]['Min'].toFixed(2))
          , a = as[i]
          , current_price_element = a.parentElement.querySelector('.u-price')
        if (current_price_element) {
          let current_price = Number(_.first(current_price_element.textContent.match(/[\d.]+/)))
            , styles = {fontStyle: 'normal'}
            , price_range = COLOR.NONE
          if (current_price < min_price) {
            price_range = COLOR.AWESOME
          } else if (current_price === min_price) {
            price_range = COLOR.OKAY
          } else if (current_price > min_price) {
            price_range = COLOR.BAD
          }
          let info = createInfoElement(`历史最低: ¥ ${min_price.toFixed(2)}`, price_range)
          a.parentElement.style.overflow = 'visible'
          a.parentElement.appendChild(info)
          a.parentElement[KEY] = true
        }
      }
      resolve()
    })
    .catch(reject)
  })
}

function getIdFromA(a) {
  if(a.parentElement[KEY]) {
    return
  }
  let pathname = pathname2Array(a.pathname)
    , id = pathname[1]
  return {id, a}
}

function log(title = null) {
  try {
    if(title === null) {
      return console.log.bind(console)
    }
    return (obj) => {
      if(_.isString(obj)) {
        console.log(`${title}: ${obj}`)
      } else {
        console.log(`${title}:`)
        console.dir(obj)
      }
      return obj
    }
  } catch(e) {
    console.error(e)
  }
}

function getMinTimeline(timelines) {
  _.each(timelines, timeline => {
    timeline.Price = Number(timeline.Price)
  })
  return _.reduceRight(timelines, (min, timeline) => min.Price > timeline.Price ? timeline : min) || {Price: NaN}
}

function getMinPrice(timelines) {
  return getMinTimeline(timelines).Price
}

function getCookie(name) {
  let value = '; ' + document.cookie
    , parts = value.split('; ' + name + '=')
  if(parts.length == 2) {
    return parts.pop().split(';').shift();
  }
}

function queryMutations(mutations, selector) {
  return _(mutations)
    .map(mutation => mutation.addedNodes)
    .filter(nodes => nodes.length > 0)
    .map(_.toArray)
    .flatten()
    .uniq()
    .filter(node => node.querySelectorAll)
    .map(node => _.toArray(node.querySelectorAll(selector)))
    .flatten()
    .value()
}

function addBookElementObserver(callback) {
  new MutationObserver(mutations => {
    let as = queryMutations(mutations, 'a.title[href^="/book/"]')
    if (as.length > 0) {
      callback(as)
    }
  }).observe(document.querySelector('.m-favorite .container'), {
    childList: true
  , subtree: true
  })
}

function addReaderElementObserver(callback) {
  new MutationObserver(mutations => {
    let svgs = queryMutations(mutations, 'svg')
    if (svgs.length > 0) {
      callback(svgs)
    }
  }).observe(document.querySelector('.j-page-container'), {
    childList: true
  , subtree: true
  })
}

function getFavsPromise(start = 0, count = 10) {
  let _t = parseInt(new Date().getTime() / 1e3),
    _c = `${getCookie('device_id')}&${_t}`.split('').reduce((t, n) => (131 * t + n.charCodeAt(0)) % 65536, 0)
  return new Promise((resolve, reject) => {
    fetch('http://www.duokan.com/discover/user/fav/list_favs', {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: serialize({
        type: 0,
        start,
        count,
        _t,
        _c
      })
    })
    .then(status)
    .then(json)
    .then(resolve)
    .catch(reject)
  })
}

function getBookInfoByDuokanApiPromise(id) {
  return new Promise((resolve, reject) => {
    fetch(`http://www.duokan.com/hs/v0/android/store/book/${encodeURIComponent(id)}`)
    .then(status)
    .then(json)
    .then(response => response.item)
    .then(resolve)
    .catch(reject)
  })
}

function getInnerText(e) {
  if (e) {
    return e.innerText
  } else {
    return null
  }
}

function getBookInfoByDocumentPromise() {
  let title = _.trim(getInnerText(document.querySelector('.desc h3')))
    , isbn = _.trim(getInnerText(document.querySelector('[itemprop="isbn"]')))
    , authors = _.trim(getInnerText(document.querySelector('[itemprop="author"]')))
    , rights = _.trim(getInnerText(document.querySelector('[itemprop="copyrightHolder"]')))
    , translators = _.trim(getInnerText(document.querySelector('[itemprop="translators"]')))
  return Promise.resolve({title, authors, translators, rights, isbn})
}

function insertOptionForm() {
  let container = document.querySelector('.u-nav-stacked ul')
    , optionForm = renderReactElement(<Components.OptionForm />, 'li')
  container.appendChild(optionForm)
  return optionForm
}

function searchBookByDoubanApiPromise({title, authors = '', translators = '', publisher = '', isbn = ''}) {
  console.log(arguments)
  return new Promise((resolve, reject) => {
    if (isbn) {
      return fetch(`https://api.douban.com/v2/book/isbn/${encodeURIComponent(isbn)}`)
      .then(status)
      .then(json)
      .then(resolve)
    } else if (title) {
      return fetch(`https://api.douban.com/v2/book/search?&q=${encodeURIComponent(title)}`)
      .then(status)
      .then(json)
      .then(({books}) => {
        let book = _(books).each(book => {
            let levenOfTitle = leven(title, book.title),
              levenOfAuthor = leven(authors, book.author.join('，')),
              levenOfTranslator = leven(translators, book.translator.join('，')),
              levenOfPublisher = leven(publisher, book.publisher)
            book.levenValue = levenOfTitle * 10 + levenOfAuthor * 5 +
              levenOfTranslator * 5
          })
          .min('levenValue');
        (book ? resolve : reject)(book)
      })
      .catch(reject)
    }
    return reject('No enough query keyword')
  })
}

function getWishPromise() {
  return new Promise((resolve, reject) => {
    getFavsPromise()
    .then(({total}) => {
      let count = 30
        , ps = []
      for(let i = 0; i < total; i += count) {
        ps.push(getFavsPromise(i, count))
      }
      return ps
    })
    .then(ps => Promise.all(ps))
    .then(data => _(data)
      .map(obj => obj.data)
      .flatten()
      .value()
    )
    .then(books => _.map(books, ({source_id}) => getBookInfoByDuokanApiPromise(source_id)))
    .then(ps => Promise.all(ps))
    .then(resolve)
    .catch(reject)
  })
}

function commonHandler() {
  let obj = _.map(document.querySelectorAll('a.title[href^="/book/"]'), getIdFromA)
    , ids = _.pluck(obj, 'id')
    , as = _.pluck(obj, 'a')
  getBookPromise(ids.join(',')).then(books => {
    for(let i in books) {
      let min_price = books[i]['Min'].toFixed(2)
        , info = createInfoElement(`历史最低: ¥ ${min_price}`)
        , a = as[i]
      a.parentElement.style.overflow = 'visible'
      a.parentElement.appendChild(info)
      a.parentElement[KEY] = true
    }
  })
  .catch(errorHandler)
}

function singleHandler([, id]) {
  getBookPromise(id).then(([data]) => {
    let timeline = data.Timeline
      , title = data.Title
      , id = data.Id
      , parentElement = document.querySelector('.price')
    if(parentElement[KEY]) {
      return
    }
    let min = getMinTimeline(timeline)
      , price = min.Price.toFixed(2)
      , time = new Date(min.Timestamp * 1000)
      , year = time.getFullYear()
      , month = `0${time.getMonth() + 1}`.substr(-2)
      , day = `0${time.getDate()}`.substr(-2)
      , info = createInfoElement(`历史最低: ¥ ${price} (${year}-${month}-${day})`)
    parentElement.appendChild(info)

    parentElement.appendChild(createAmazonLink(title))
    getBookInfoByDocumentPromise()
      .then(({title, authors, translators, rights, isbn}) => ({title, authors, translators, publisher: rights, isbn}))
      .then(searchBookByDoubanApiPromise)
      .then(book => {
        parentElement.appendChild(createDoubanLink(title, book.alt))
        if (book.rating) {
          parentElement.appendChild(createDoubanRating(book.rating.average))
        }
      })
    parentElement[KEY] = true
  })
  .catch(errorHandler)
}

function favouriteHandler() {
  let option_form = insertOptionForm()
    , local = JSON.parse(localStorage.getItem('local'))
    , fav = local.fav.list
  addBookElementObserver((as) => {
    Promise.resolve((() => {
      let error_title_books = document.querySelectorAll('a.title[href^="javascript:"]')
        , fav_titles = fav.map(book => book.title)
      _.each(error_title_books, a => {
        let title = a.textContent
          , index = _.findIndex(fav, fav_book => title === fav_book.title)
          , book = fav[index]
        if (index >= 0) {
          a.href = `/book/${book.id}`
        }
      })
      return error_title_books
    })())
    .then(_.toArray)
    .then((error_books) => _(as).concat(error_books).value())
    .then(aElementsHandler)
    .then(() => _.defer(Components.OptionForm.updateDOM))
    .catch(errorHandler)
  })
  getWishPromise().then((books) => {
    let container = document.querySelector('.j-container')
      , paid = local.paidList
      , paid_ids = paid.map(book => book.id)
      , fav_ids = fav.map(book => book.id)
      , carted = local.cart
      , carted_ids = carted.map(book => book.id)
    _(books)
    .filter((book) => !_.include(fav_ids, book.book_id))
    .each(_.wrap(book => {
      book.paid = _.include(paid_ids, book.book_id)
      book.carted = _.include(carted_ids, book.book_id)
      book.cover = book.cover.replace(/m$/, 't')
      book.url = `/book/${book.sid}`
      if(book.new_price) {
        book.old_price = book.price
        book.price = book.new_price
      }
      container.appendChild(<Components.BookItem book={book} />)
    }, _.defer))
    .run()
    _.defer(Components.OptionForm.updateDOM)
  })
}

async function readerHandler() {
  let {fontList} = await chrome.runtime.sendMessage({type: 'fontList'})
    , insertReaderOption = _.once((container = document.body) => {
      let readerOption = renderReactElement(<Components.ReaderOption fontList={fontList} />)
      container.appendChild(readerOption)
    })
  addReaderElementObserver((svgs) => {
    if (document.querySelector('svg > *')) {
      insertReaderOption()
    }
    if (Components.FontSelector.updateDOM && Components.BackgroundSelector.updateDOM) {
      Components.FontSelector.updateDOM(svgs)
      Components.BackgroundSelector.updateDOM()
    }
  })
}

async function sendLocalStorage() {
  await chrome.runtime.sendMessage({type: 'localStorage', data: localStorage})
}

!function main() {
  let pathname = pathname2Array(new URL(document.URL).pathname)
    , handler = {
        book: singleHandler // 单页
      , favourite: favouriteHandler // 收藏
      , special: commonHandler // 专题
      , r: commonHandler // 畅销榜
      , list: commonHandler // 分类
      , publisher: commonHandler // 版权方
      , reader: readerHandler // 多看阅读器
      , search: commonHandler // 搜索
      }

  if(_.first(pathname) === 'u') {
    pathname.shift()
  }

  !(handler[_.first(pathname)] || PASS)(pathname)
  sendLocalStorage()
}()
