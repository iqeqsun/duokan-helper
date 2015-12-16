'use strict'

import 'babel-polyfill'
import _ from 'lodash'
import qwest from 'qwest'
import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

const API = 'http://127.0.0.1:8080'
const KEY = Symbol('duokan-helper')

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
  MouseLeaveHandler = () => {
    this.setState({hover: false})
  }
  MouseEnterHandler = () => {
    this.setState({hover: true})
  }
  render = () => {
    let li_class = classNames('u-bookitm1','u-bookitm1-1', {
      'u-bookitm1-hover': this.state.hover
    })
    let book = this.props.book
    const KEY = book.sid
    return (
      <li className={li_class} onMouseLeave={this.MouseLeaveHandler} onMouseEnter={this.MouseEnterHandler}>
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

function Pathname2Array(s) {
  return _.rest(s.split('/'))
}

function StrIsNumber(v) {
  return /^\d+$/.test(v)
}

function ErrorHandler() {
  console.error(arugments)
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
  _.each(timelines, timeline => {
    timeline.Price = Number(timeline.Price)
  })
  return _.reduceRight(timelines, (min, timeline) => min.Price > timeline.Price ? timeline : min) || {Price: NaN}
}

function GetMinPrice(timelines) {
  return GetMinTimeline(timelines).Price
}

function GetCookie(name) {
  let value = '; ' + document.cookie
    , parts = value.split('; ' + name + '=')
  if (parts.length == 2) {
    return parts.pop().split(';').shift();
  }
}

function GetFavsPromise(start = 0, count = 10) {
  let _t = parseInt(new Date().getTime() / 1e3)
    , _c = `${GetCookie('device_id')}&${_t}`.split('').reduce((t, n) => (131 *
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
          console.log(response)
          reject(e)
        }
      })
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
          , ps = []
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
    , id = pathname[1]
  //TODO: duokan's newly url pattern http://www.duokan.com/book/c11725b8126b4dc1ada0d25b1367b3d1
  /*
  if (!StrIsNumber(id)) {
    return
  }
  */
  GetBookPromise(id).then((xhr, {Timeline}) => {
      let min_price = GetMinPrice(Timeline).toFixed(2)
        , info = CreateInfoElement(`历史最低: ¥ ${min_price}`)
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
  GetBookPromise(id)
    .then((xhr, {Timeline}) => {
      let parentElement = document.querySelector('.price')
      if (parentElement[KEY]) {
        return
      }
      let min = GetMinTimeline(Timeline)
        , price = min.Price.toFixed(2)
        , time = new Date(min.Timestamp * 1000)
        , year = time.getFullYear()
        , month = `0${time.getMonth() + 1}`.substr(-2)
        , day = `0${time.getDate()}`.substr(-2)
        , info = CreateInfoElement(`于${year}-${month}-${day}为最低价 ¥ ${price}`)
      parentElement.appendChild(info)
      parentElement[KEY] = true
    })
    .catch(ErrorHandler)
}

function FavouriteHandler() {
  new MutationObserver(mutations => {
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
  GetWishPromise().then((books) => {
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

let pathname = Pathname2Array(new URL(document.URL).pathname)
  , handler = {
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
