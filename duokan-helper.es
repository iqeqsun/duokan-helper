'use strict'

import 'babel-polyfill'
import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import update from 'react-addons-update'
import classNames from 'classnames'
import leven from 'leven'
import ChromePromise from 'chrome-promise'

const chrome = new ChromePromise()

const NAME = 'duokan-helper'
const API = 'http://duokan.blackglory.me'
const VERSION = 'v1'
const BASEPATH = `${API}/${VERSION}`
const KEY = Symbol(NAME)

const MDC = {
  BLUE: '#2196F3'
, GREEN: '#4CAF50'
, YELLOW: '#FFEB3B'
}

const COLOR = {
  BAD: 'inherit'
, OKAY: MDC.BLUE
, AWESOME: MDC.GREEN
, NONE: 'inherit'
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

let optionFormUpdateDOM = null
  , fontSelectorUpdateDOM = null
  , backgroundSelectorUpdateDOM = null

class BookItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {hover: false}
  }

  mouseLeaveHandler = () => {
    this.setState({hover: false})
  };

  mouseEnterHandler = () => {
    this.setState({hover: true})
  };

  render = () => {
    let li_class = classNames('u-bookitm1', 'u-bookitm1-1', {'u-bookitm1-hover': this.state.hover})
      , book = this.props.book
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
  };
}

class OptionForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show: {
        awesome: true
      , okay: true
      , bad: true
      , owned: false
      }
    , count: {
        awesome: 0
      , okay: 0
      , bad: 0
      , owned: 0
      }
    }
    this.updateDOM = this.updateDOM.bind(this)
    optionFormUpdateDOM = this.updateDOM
    this.updateDOM()
  }

  componentDidMount() {
    this.isReal = true
  }

  componentWillUnmount() {
    this.isReal = false
  }

  checkboxChangeHandler = (field, e) => {
    let fields = field.split('.')
      , nextState = {}
    _.reduce(fields, (state, field, i) => {
      if (!state[field]) {
        if (i != _.findLastIndex(fields))  {
          state[field] = {}
        } else {
          state[field] = {
            $set: e.target.checked
          }
        }
      }
      return state[field]
    }, nextState)
    let newState = update(this.state, nextState)
    this.setState(newState)
    _.defer(this.updateDOM)
  };

  updateDOM() {
    let bookitems = document.querySelectorAll('.j-container .u-bookitm1')
      , countAwesome = 0
      , countOkay = 0
      , countBad = 0
      , countOwned = 0
    _.each(bookitems, (bookitem) => {
      let isOwned = bookitem.querySelector('.act').textContent.includes('已购买')
        , priceAwesome = !!bookitem.querySelector(`[data-pricerange="${COLOR.AWESOME}"]`)
        , priceOkay = !!bookitem.querySelector(`[data-pricerange="${COLOR.OKAY}"`)
        , priceBad = !!bookitem.querySelector(`[data-pricerange="${COLOR.BAD}"`)
        , display = 'block'
      if (isOwned) {
        countOwned++
        if (this.state.show.owned) {
          display = 'block'
        } else {
          display = 'none'
        }
      } else {
        if (priceAwesome) {
          countAwesome++
        } else if (priceOkay) {
          countOkay++
        } else if (priceBad) {
          countBad++
        }
      }
      if ((priceAwesome && !this.state.show.awesome) ||
          (priceOkay && !this.state.show.okay) ||
          (priceBad && !this.state.show.bad)) {
        display = 'none'
      }
      bookitem.style.display = display
    })
    if (this.isReal) {
      this.setState(update(this.state, {
        count: {
          awesome: {
            $set: countAwesome
          }
        , okay: {
            $set: countOkay
          }
        , bad: {
            $set: countBad
          }
        , owned: {
            $set: countOwned
          }
        }
      }))
    }
  };

  render = () => {
    return (
      <form>
        <label style={{color: COLOR.BAD}}>
          <input type="checkbox" checked={this.state.show.bad} onChange={this.checkboxChangeHandler.bind(this, 'show.bad')} />显示高于最低价格的书籍({this.state.count.bad})
        </label>
        <br />
        <label style={{color: COLOR.OKAY}}>
          <input type="checkbox" checked={this.state.show.okay} onChange={this.checkboxChangeHandler.bind(this, 'show.okay')} />显示与最低价格持平的书籍({this.state.count.okay})
        </label>
        <br />
        <label style={{color: COLOR.AWESOME}}>
          <input type="checkbox" checked={this.state.show.awesome} onChange={this.checkboxChangeHandler.bind(this, 'show.awesome')} />显示低于最低价格的书籍({this.state.count.awesome})
        </label>
        <br />
        <label>
          <input type="checkbox" checked={this.state.show.owned} onChange={this.checkboxChangeHandler.bind(this, 'show.owned')} />显示已购书籍({this.state.count.owned})
        </label>
        <br />
      </form>
    )
  };
}

class FontSelector extends React.Component {
  constructor(props) {
    super(props)
    this.defaultFont = fontFamilyDetect(this.props.fontList, document.querySelector('svg > *'))
    this.state = {
      font: _.first(this.defaultFont)
    }
    fontSelectorUpdateDOM = this.setFont
  }

  inputChangeHandler = (field, e) => {
    let nextState = {}
    nextState[field] = e.target.value
    this.setState(nextState)
    this.setFont()
  };

  setFont = svgs => {
    _.defer(() => this.updateDOM(svgs))
  };

  updateDOM = (svgs = document.querySelectorAll('div.text > svg')) => {
    _(svgs)
    .map(svg => svg.children)
    .map(_.toArray)
    .flatten()
    .each(e => e.style.fontFamily = `"${this.state.font}", ${this.defaultFont}`)
    .run()
  };

  render = () => {
    return (
      <div style={{textAlign: 'start'}}>
        <label>字体: </label>
        <select style={{width: '15rem'}} value={this.state.font} onChange={this.inputChangeHandler.bind(this, 'font')}>
        {this.props.fontList.map(font => <option key={id()} value={font.fontId}>{font.displayName}</option>)}
        </select>
      </div>
    )
  };
}

class BackgroundSelector extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      color: `#${rgb2hex(window.getComputedStyle(this.getContainer(), null).backgroundColor)}`
    }
    backgroundSelectorUpdateDOM = this.setBackground
  }

  getContainer() {
    return document.querySelector('.j-page-container.j-md-book')
  }

  getBookPages() {
    let bookPages = this.getContainer().querySelectorAll('.book_page_wrapper')
    return bookPages
  }

  inputChangeHandler = (field, e) => {
    let nextState = {}
    nextState[field] = e.target.value
    this.setState(nextState)
    this.setBackground()
  };

  setBackground = bookPages => {
    _.defer(() => this.updateDOM(bookPages))
  };

  updateDOM = (bookPages = this.getBookPages()) => {
    _.each(bookPages, e => {e.style.backgroundColor = this.state.color})
  };

  render = () => {
    return (
      <div style={{textAlign: 'start'}}>
        <label>背景色: </label>
        <input type="color" value={this.state.color} onChange={this.inputChangeHandler.bind(this, 'color')} />
      </div>
    )
  };
}

class ReaderOption extends React.Component {
  constructor(props) {
    super(props)
  }

  render = () => {
    let fromStyle = {
          position: 'absolute'
        , top: '1rem'
        , left: '1rem'
        , zIndex: 999
        , color: 'white'
        }
    return (
      <form style={fromStyle}>
        <BackgroundSelector />
        <FontSelector fontList={this.props.fontList} />
      </form>
    )
  };
}

function fontFamilyDetect(fontList, e) {
  let fontIds = _.map(fontList, font => font.fontId)
    , fontFamily = window.getComputedStyle(e, null).fontFamily.split(',')
    , font = _(fontFamily)
        .map(fontName => fontName.trim())
        .map(fontName => fontName.match(/(['"]?)([\S\s]+)(\1)/)[2])
        .filter(fontName => fontIds.includes(fontName))
        .value()
  return font
}

function status(response) {
  if (response.status >= 200 && response.status) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function rgb2hex(...rgb) {
  rgb = rgb.join().match(/\d+/g)
  return ((rgb[0] << 16) + (rgb[1] << 8) + (+rgb[2])).toString(16)
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

function getBookInfoByDocumentPromise() {
  let title = _.trim(document.querySelector('.desc h3').innerText)
    , isbn = _.trim(document.querySelector('[itemprop="isbn"]').innerText)
    , authors = _.trim(document.querySelector('[itemprop="author"]').innerText)
    , rights = _.trim(document.querySelector('[itemprop="copyrightHolder"]').innerText)
    , translators = _.trim(document.querySelector('[itemprop="translators"]').innerText)
  return Promise.resolve({title, authors, translators, rights, isbn})
}

function insertOptionForm() {
  let container = document.querySelector('.u-nav-stacked ul')
    , optionForm = renderReactElement(<li><OptionForm /></li>)
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
    .then(() => _.defer(optionFormUpdateDOM))
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
      container.appendChild(<BookItem book={book} />)
    }, _.defer))
    .run()
    _.defer(optionFormUpdateDOM)
  })
}

async function readerHandler() {
  let {fontList} = await chrome.runtime.sendMessage({type: 'fontList'})
    , insertReaderOption = _.once((container = document.body) => {
      let readerOption = renderReactElement(<ReaderOption fontList={fontList} />)
      container.appendChild(readerOption)
    })
  addReaderElementObserver((svgs) => {
    if (document.querySelector('svg > *')) {
      insertReaderOption()
    }
    if (fontSelectorUpdateDOM) {
      fontSelectorUpdateDOM(svgs)
      backgroundSelectorUpdateDOM()
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
