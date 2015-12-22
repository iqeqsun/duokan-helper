'use strict'

import 'babel-polyfill'
import _ from 'lodash'
import qwest from 'qwest'
import React from 'react'
import reqwest from 'reqwest'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import leven from 'leven'

const NAME = 'duokan-helper'
const API = 'http://127.0.0.1:8080'
const KEY = Symbol(NAME)

const PASS = () => {}

const id = (() => {
  function* gen() {
    for(let i = 0;;) {
      yield ++i
    }
  }
  let g = gen()
  return () => g.next().value
})()

class BookItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {hover: false}
  }
  mouseLeaveHandler = () => {
    this.setState({hover: false})
  }
  mouseEnterHandler = () => {
    this.setState({hover: true})
  }
  render = () => {
    let li_class = classNames('u-bookitm1','u-bookitm1-1', {
      'u-bookitm1-hover': this.state.hover
    })
    let book = this.props.book
    const KEY = book.sid
    return (
      <li className={li_class} onMouseLeave={this.mouseLeaveHandler} onMouseEnter={this.mouseEnterHandler}>
        <a className="book" href={ book.url } hidefocus="hidefocus">
          <img src={ book.cover } ondragstart="return false;" oncontextmenu="return false;" onload="onLoadImg(this)" style={{display: 'block'}} />
        </a>
        <div className="info">
          <div className="wrap">
            <a href={ book.url } className="title" hidefocus="hidefocus">{ book.title }</a>
            <p className="u-author"><span>{ book.authors }</span></p>
            <div className="u-price">
            {do {
              if (book.price != 0) {
                [
                  <em key={id()}>¥ { (+book.price * 1.0).toFixed(2) }</em>,
                  !!book.new_price && <del key={id()}>¥ { (+book.old_price * 1.0).toFixed(2) }</del>
                ].filter((n) => n !== true)
              } else {
                <b key={id()}>免费</b>
              }
            }}
            </div>
          </div>
          <div className="act">
            {do {
              if (book.price != 0) {
                if (!!book.paid) {
                  <span key={id()}>已购买<b className="l"></b><b className="r"></b></span>
                } else if (!!book.carted) {
                  <span key={id()}>已加入购物车</span>
                } else {
                  /*
                  [
                    <a key={id()} href="javascript:void(0)" className="j-cart" hidefocus="hidefocus">加入购物车</a>,
                    <span key={id()} style={{display: 'none'}}>已加入购物车</span>
                  ]
                  */
                }
              } else {
                if (!!book.paid) {
                  <span key={id()}>已领取</span>
                } else {
                  <a key={id()} href="<%= book.url %>" hidefocus="hidefocus">去领取</a>
                }
              }
            }}
            {/*<span className="u-sep">|</span><a className="j-delete delete" href="javascript:void(0);" hidefocus="hidefocus">取消收藏</a>*/}
          </div>
        </div>
        <div className="mask j-mask">
          <div className="u-mask1"></div>
          <a className="show j-restore" href="javascript:void(0)" hidefocus="hidefocus">恢复收藏</a>
        </div>
      </li>
    )
  }
}

function pathname2Array(s) {
  return _.rest(s.split('/'))
}

function errorHandler() {
  console.error(arugments)
}

function getBookPromise(id) {
  return qwest.get(`${API}/book/${id}`)
    .catch(errorHandler)
}

function createInfoElement(text) {
  let info = document.createElement('i')
  info.textContent = text
  return info
}

function log(title = null) {
  try {
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
      return obj
    }
  } catch (e) {
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
  if (parts.length == 2) {
    return parts.pop().split(';').shift();
  }
}

function getFavsPromise(start = 0, count = 10) {
  let _t = parseInt(new Date().getTime() / 1e3)
    , _c = `${getCookie('device_id')}&${_t}`.split('').reduce((t, n) => (131 *
    t + n.charCodeAt(0)) % 65536, 0)
  return new Promise((resolve, reject) => {
    qwest.post('http://www.duokan.com/discover/user/fav/list_favs', {
        type: 0,
        start,
        count,
        _t,
        _c
      })
      .then((xhr, response) => {
        try {
          resolve(JSON.parse(response))
        } catch(e) {
          log(e)(response)
          reject(e)
        }
      })
      .catch(reject)
  })
}

function getBookInfoByDuokanApiPromise(id) {
  return new Promise((resolve, reject) => {
    qwest.get(`http://www.duokan.com/hs/v0/android/store/book/${encodeURIComponent(id)}`)
      .then((xhr, response) => resolve(response.item))
      .catch(reject)
  })
}

function searchBookByDoubanApiPromise({title, authors='', translators='', publisher=''}) {
  return new Promise((resolve, reject) => {
    reqwest({
        url: `https://api.douban.com/v2/book/search?&q=${encodeURIComponent(title)}`
      , type: 'json'
    }).then(({books}) => {
      let book = _(books).each(book => {
        let levenOfTitle = leven(title, book.title)
          , levenOfAuthor = leven(authors, book.author.join('，'))
          , levenOfTranslator = leven(translators, book.translator.join('，'))
          , levenOfPublisher = leven(publisher, book.publisher)
        book.levenValue = levenOfTitle * 10 + levenOfAuthor * 5 + levenOfTranslator * 5
      })
      .min('levenValue')
      ;(book ? resolve : reject)(book)
    })
    .catch(reject)
  })
}

function getWishPromise() {
  return new Promise((resolve, reject) => {
    getFavsPromise()
      .then(({total}) => {
        let count = 30
          , ps = []
        for (let i = 0; i < total; i += count) {
          ps.push(getFavsPromise(i, count))
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
        }) => getBookInfoByDuokanApiPromise(source_id))
        return t
      })
      .then(ps => Promise.all(ps))
      .then(resolve)
      .catch(reject)
  })
}

function createElementByReact(jsx) {
  let div = document.createElement('div')
  ReactDOM.render(jsx, div)
  return div.children[0]
}

function createDoubanLink(title, url = `https://book.douban.com/subject_search?search_text=${encodeURIComponent(title)}`) {
  return createElementByReact(<div><a href={url} target="_blank">到豆瓣看大家对 {title} 的评价</a></div>)
}

function createDoubanRating(rating) {
  return createElementByReact(<span>豆瓣评分: {rating}</span>)
}

function createAmazonLink(title) {
  return createElementByReact(<div><a href={`http://www.amazon.cn/s/${encodeURIComponent(title)}`} target="_blank">到亚马逊购买 {title} 的实体书</a></div>)
}

function aElementsHandler(elements) {
  if (elements.length === 0) {
    return
  }
  let obj = _.map(elements, getIdFromA)
    , ids = _.pluck(obj, 'id')
    , as = _.pluck(obj, 'a')
  getBookPromise(ids.join(',')).then((xhr, books) => {
    for (let i in books) {
      if (books[i] === null) {
        continue
      }
      let timeline = books[i]['Timeline']
        , min_price = getMinPrice(timeline).toFixed(2)
        , info = createInfoElement(`历史最低: ¥ ${min_price}`)
        , a = as[i]
      a.parentElement.style.overflow = 'visible'
      a.parentElement.appendChild(info)
      a.parentElement[KEY] = true
    }
  })
  .catch(errorHandler)
}

function getIdFromA(a) {
  if (a.parentElement[KEY]) {
    return
  }
  let pathname = pathname2Array(a.pathname)
    , id = pathname[1]
  return {id, a}
}

function commonHandler() {
  let obj = _.map(document.querySelectorAll('a.title[href^="/book/"]'), getIdFromA)
    , ids = _.pluck(obj, 'id')
    , as = _.pluck(obj, 'a')
  getBookPromise(ids.join(',')).then((xhr, books) => {
    for (let i in books) {
      let timeline = books[i]['Timeline']
        , min_price = getMinPrice(timeline).toFixed(2)
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
  getBookPromise(id).then((xhr, [data]) => {
      let timeline = data.Timeline
        , title = data.Title
        , id = data.Id
        , parentElement = document.querySelector('.price')
      if (parentElement[KEY]) {
        return
      }
      let min = getMinTimeline(timeline)
        , price = min.Price.toFixed(2)
        , time = new Date(min.Timestamp * 1000)
        , year = time.getFullYear()
        , month = `0${time.getMonth() + 1}`.substr(-2)
        , day = `0${time.getDate()}`.substr(-2)
        , info = createInfoElement(`于${year}-${month}-${day}为最低价 ¥ ${price}`)
      parentElement.appendChild(info)

      parentElement.appendChild(createAmazonLink(title))
      getBookInfoByDuokanApiPromise(id)
      .then(({title, authors, translators, rights}) => ({title, authors, translators, publisher: rights}))
      .then(searchBookByDoubanApiPromise)
      .then(book => {
        parentElement.appendChild(createDoubanLink(title, book.alt))
        parentElement.appendChild(createDoubanRating(book.rating.average))
      })
      parentElement[KEY] = true
    })
    .catch(errorHandler)
}

function favouriteHandler() {
  new MutationObserver(mutations => {
    let as = _(mutations)
      .map(mutation => mutation.addedNodes)
      .filter(nodes => nodes.length > 0)
      .map(_.toArray)
      .flatten()
      .uniq()
      .filter(node => node.querySelectorAll)
      .map(node => _.toArray(node.querySelectorAll(
        'a.title[href^="/book/"]')))
      .flatten()
      .value()
    aElementsHandler(as)
  }).observe(document.body, {
    childList: true,
    subtree: true
  })
  getWishPromise().then((books) => {
    let container = document.querySelector('.j-container')
      , local = JSON.parse(localStorage.getItem('local'))
      , paid = local.paidList
      , paid_ids = paid.map(book => book.id)
      , fav = local.fav.list
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
        if (book.new_price) {
          book.old_price = book.price
          book.price = book.new_price
        }
        let div = document.createElement('div')
        ReactDOM.render(<BookItem book={book} />, div)
        container.appendChild(div)
      }, _.defer))
      .run()
  })
}

let pathname = pathname2Array(new URL(document.URL).pathname)
  , handler = {
    book: singleHandler, // 单页
    favourite: favouriteHandler, // 收藏
    special: commonHandler, // 专题
    r: commonHandler, // 畅销榜
    list: commonHandler // 分类
  }

if (_.first(pathname) === 'u') {
  pathname.shift()
}

(handler[_.first(pathname)] || PASS)(pathname)
