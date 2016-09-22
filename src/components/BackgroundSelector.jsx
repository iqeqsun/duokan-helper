'use strict'

import React from 'react'
import _ from 'lodash'

function rgb2hex(...rgb) {
  rgb = rgb.join().match(/\d+/g)
  return ((rgb[0] << 16) + (rgb[1] << 8) + (+rgb[2])).toString(16)
}

export default class BackgroundSelector extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      color: `#${rgb2hex(window.getComputedStyle(this.getContainer(), null).backgroundColor)}`
    }
    BackgroundSelector.updateDOM = this.setBackground
  }

  getContainer() {
    return document.querySelector('.j-page-container.j-md-book')
  }

  getBookPages() {
    let bookPages = this.getContainer().querySelectorAll('.book_page_wrapper')
    return bookPages
  }

  inputChangeHandler(field, e) {
    let nextState = {}
    nextState[field] = e.target.value
    this.setState(nextState)
    this.setBackground()
  }

  setBackground(bookPages) {
    _.defer(() => this.updateDOM(bookPages))
  }

  updateDOM(bookPages = this.getBookPages()) {
    _.each(bookPages, e => {e.style.backgroundColor = this.state.color})
    document.querySelector('.rd_footer').style.backgroundColor = this.state.color
  }

  render() {
    return (
      <div style={{textAlign: 'start'}}>
        <label>背景色: </label>
        <input type="color" value={this.state.color} onChange={this.inputChangeHandler.bind(this, 'color')} />
      </div>
    )
  }
}
