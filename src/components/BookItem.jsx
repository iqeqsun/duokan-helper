'use strict'

import React from 'react'

export default class BookItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hover: false }
  }

  mouseLeaveHandler() {
    this.setState({ hover: false })
  }

  mouseEnterHandler() {
    this.setState({ hover: true })
  }

  render() {
    let li_class = classNames('u-bookitm1', 'u-bookitm1-1', { 'u-bookitm1-hover': this.state.hover })
      , book = this.props.book

    return (
      <li className={li_class} onMouseLeave={ this.mouseLeaveHandler } onMouseEnter={ this.mouseEnterHandler }>
        <a className="book" href={ book.url } hidefocus="hidefocus">
          <img src={ book.cover } ondragstart="return false;" oncontextmenu="return false;" onload="onLoadImg(this)" style={{ display: 'block' }} />
        </a>
        <div className="info">
          <div className="wrap">
            <a href={ book.url } className="title" hidefocus="hidefocus">{ book.title }</a>
            <p className="u-author"><span>{ book.authors }</span></p>
            <div className="u-price">
            {do {
              if (book.price != 0) {
                [
                  <em key={ id() }>¥ { (+book.price * 1.0).toFixed(2) }</em>,
                  !!book.new_price && <del key={ id() }>¥ { (+book.old_price * 1.0).toFixed(2) }</del>
                ].filter((n) => n !== true)
              } else {
                <b key={ id() }>免费</b>
              }
            }}
            </div>
          </div>
          <div className="act">
            {do {
              if (book.price != 0) {
                if (!!book.paid) {
                  <span key={ id() }>已购买<b className="l"></b><b className="r"></b></span>
                } else if (!!book.carted) {
                  <span key={ id() }>已加入购物车</span>
                }
              } else {
                if (!!book.paid) {
                  <span key={ id() }>已领取</span>
                } else {
                  <a key={ id() } href="<%= book.url %>" hidefocus="hidefocus">去领取</a>
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
