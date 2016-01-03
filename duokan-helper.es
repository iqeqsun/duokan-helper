'use strict'

import 'babel-polyfill'
import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import leven from 'leven'

const NAME = 'duokan-helper'
const API = 'http://duokan.blackglory.me'
const VERSION = 'v1'
const BASEPATH = `${API}/${VERSION}`
const KEY = Symbol(NAME)

const MDC = {
  BLUE: '#2196F3',
  GREEN: '#4CAF50',
  YELLOW: '#FFEB3B'
}

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
    let li_class = classNames('u-bookitm1', 'u-bookitm1-1', {'u-bookitm1-hover': this.state.hover})
      , book = this.props.book
    const KEY = book.id
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
                }
              } else {
                if (!!book.paid) {
                  <span key={id()}>已领取</span>
                } else {
                  <a key={id()} href="<%= book.url %>" hidefocus="hidefocus">去领取</a>
                }
              }
            }}
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

class OptionForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showYellow: true
    , showBlue: true
    , showGreen: true
    , showOwned: false
    }
    this.updateDOM()
  }

  checkboxChangeHandler = (field, e) => {
    let nextState = {}
    nextState[field] = e.target.checked
    this.setState(nextState)
    setTimeout(this.updateDOM, 0)
  }

  updateDOM = () => {
    let bookitems = document.querySelectorAll('.j-container .u-bookitm1')
    _.each(bookitems, (bookitem) => {
      let isOwned = bookitem.querySelector('.act').textContent.includes('已购买')
        , isGreen = !!bookitem.querySelector('[data-color="green"]')
        , isBlue = !isGreen && !!bookitem.querySelector('[data-color="blue"]')
        , isYellow = !isGreen && isBlue
        , display = 'block'
      if (isGreen && !this.state.showGreen) {
        display = 'none'
      } else if (isBlue && !this.state.showBlue) {
        display = 'none'
      } else if (isYellow && !this.state.showYellow) {
        display = 'none'
      }
      if (isOwned && !this.state.showOwned) {
        display = 'none'
      }
      bookitem.style.display = display
    })
  }

  render = () => {
    return (
      <form>
        <input id="showYellow" type="checkbox" checked={this.state.showYellow} onChange={this.checkboxChangeHandler.bind(this, 'showYellow')} />
        <label style={{color: MDC.YELLOW}} htmlFor="showYellow">显示当前高于最低价格的书</label><br />
        <input id="showBlue" type="checkbox" checked={this.state.showBlue} onChange={this.checkboxChangeHandler.bind(this, 'showBlue')} />
        <label style={{color: MDC.BLUE}} htmlFor="showBlue">显示当前与最低价格持平的书</label><br />
        <input id="showGreen" type="checkbox" checked={this.state.showGreen} onChange={this.checkboxChangeHandler.bind(this, 'showGreen')} />
        <label style={{color: MDC.GREEN}} htmlFor="showGreen">显示当前低于最低价格的书</label><br />
        <input id="showOwned" type="checkbox" checked={this.state.showOwned} onChange={this.checkboxChangeHandler.bind(this, 'showOwned')} />
        <label htmlFor="showOwned">显示已购书籍</label><br />
      </form>
    )
  }
}

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

function createInfoElement(text, styles = {color: 'inherit'}) {
  let color = styles.color
  styles['color'] = ({
    'green': MDC.GREEN
  , 'blue': MDC.BLUE
  , 'yellow': MDC.YELLOW
  })[color] || styles['color']
  return createElementByReact(<i data-color={color} style={styles}>{text}</i>)
}

function createElementByReact(jsx) {
  let div = document.createElement('div')
  ReactDOM.render(jsx, div)
  return div.children[0]
}

function createDoubanLink(title, url = `https://book.douban.com/subject_search?search_text=${encodeURIComponent(title)}`) {
  return createElementByReact(<diV><a href={url} target="_blank">到豆瓣看大家对 {title} 的评价</a></diV>)
}

function createDoubanRating(rating) {
  if (rating === '0.0') {
    return createElementByReact(<span>豆瓣目前无人评价此书</span>)
  } else {
    return createElementByReact(<span>豆瓣评分: {rating}</span>)
  }
}

function createAmazonLink(title) {
  return createElementByReact(<div><a href={`http://www.amazon.cn/s/${encodeURIComponent(title)}`} target="_blank">到亚马逊找 {title} 的实体书/电子书</a></div>)
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
          , current_price_element = a.parentElement.querySelector('.u-price em')
        if (current_price_element) {
          let current_price = Number(_.first(current_price_element.textContent.match(/[\d.]+/)))
            , styles = {fontStyle: 'normal'}
          if (current_price < min_price) {
            styles['color'] = 'green'
          } else if (current_price === min_price) {
            styles['color'] = 'blue'
          } else if (current_price > min_price) {
            styles['color'] = 'yellow'
          }
          let info = createInfoElement(`历史最低: ¥ ${min_price}`, styles)
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
        console.log(obj)
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

function addBookElementObserver(callback) {
  new MutationObserver(mutations => {
    let as = _(mutations)
      .map(mutation => mutation.addedNodes)
      .filter(nodes => nodes.length > 0)
      .map(_.toArray)
      .flatten()
      .uniq()
      .filter(node => node.querySelectorAll)
      .map(node => _.toArray(node.querySelectorAll('a.title[href^="/book/"]')))
      .flatten()
      .value()
    if (as.length > 0) {
      callback(as)
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
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

function insertOptionForm() {
  let container = document.querySelector('.u-nav-stacked ul')
    , li = document.createElement('li')
    , option_form = ReactDOM.render(<OptionForm />, li)
  container.appendChild(li)
  return option_form
}

function searchBookByDoubanApiPromise({title, authors = '', translators = '', publisher = ''}) {
  return new Promise((resolve, reject) => {
    fetch(`https://api.douban.com/v2/book/search?&q=${encodeURIComponent(title)}`)
    .then(status)
    .then(json)
    .then(({books}) => {
      let book = _(books).each(book => {
          let levenOfTitle = leven(title, book.title),
            levenOfAuthor = leven(authors, book.author.join('，')),
            levenOfTranslator = leven(translators, book.translator.join(
              '，')),
            levenOfPublisher = leven(publisher, book.publisher)
          book.levenValue = levenOfTitle * 10 + levenOfAuthor * 5 +
            levenOfTranslator * 5
        })
        .min('levenValue');
      (book ? resolve : reject)(book)
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
      , info = createInfoElement(`历史最低价为 ¥ ${price} (${year}-${month}-${day})`)
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
  let option_form = insertOptionForm()
    , local = JSON.parse(localStorage.getItem('local'))
    , fav = local.fav.list
  addBookElementObserver((as) => {
    Promise.resolve((() => {
      let error_title_books = document.querySelectorAll('a.title[href^="javascript:"]')
        , fav_titles = fav.map(book => book.title)
      log('error_title')(error_title_books)
      log('fav')(fav)
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
    .then(() => setTimeout(option_form.updateDOM, 0))
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
      let div = document.createElement('div')
      ReactDOM.render(<BookItem book={book} />, div)
      container.appendChild(div)
    }, _.defer))
    .run()
    setTimeout(option_form.updateDOM, 0)
  })
}

function injectScript() {
  function code() {
    // NOTHING
  }
  let script = document.createElement('script')
  script.textContent = `!(${code.toString()})()`
  !(document.head || document.documentElement).appendChild(script)
  //script.parentNode.removeChild(script)
}

!function main() {
  let pathname = pathname2Array(new URL(document.URL).pathname)
    , handler = {
      book: singleHandler // 单页
    , favourite: favouriteHandler // 收藏
    , special: commonHandler // 专题
    , r: commonHandler // 畅销榜
    , list: commonHandler // 分类
    }

  if(_.first(pathname) === 'u') {
    pathname.shift()
  }

  !(handler[_.first(pathname)] || PASS)(pathname)
  injectScript()
}()
