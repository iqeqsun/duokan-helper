'use strict'

import React from 'react'
import _ from 'lodash'
import { id } from '../common'

function fontFamilyDetect(fontList, e) {
  let fontIds = _.map(fontList, font => font.fontId)
    , fontFamily = window.getComputedStyle(e, null).fontFamily.split(',')

  let font = _(fontFamily)
    .map(fontName => fontName.trim())
    .map(fontName => fontName.match(/(['"]?)([\S\s]+)(\1)/)[2])
    .filter(fontName => fontIds.includes(fontName))
    .value()

  return font
}

export default class FontSelector extends React.Component {
  constructor(props) {
    super(props)
    this.defaultFont = fontFamilyDetect(this.props.fontList, document.querySelector('svg > *'))
    this.state = {
      font: _.first(this.defaultFont)
    }
    FontSelector.updateDOM = this.setFont
  }

  inputChangeHandler(field, e) {
    let nextState = {}
    nextState[field] = e.target.value
    this.setState(nextState)
    this.setFont()
  }

  setFont(svgs) {
    _.defer(() => this.updateDOM(svgs))
  }

  updateDOM(svgs = document.querySelectorAll('div.text > svg')) {
    _(svgs)
    .map(svg => svg.children)
    .map(_.toArray)
    .flatten()
    .each(e => e.style.fontFamily = `"${ this.state.font }", ${ this.defaultFont }`)
  }

  render() {
    return (
      <div style={{ textAlign: 'start' }}>
        <label>字体: </label>
        <select
          style={{ width: '15rem' }}
          value={ this.state.font }
          onChange={ this.inputChangeHandler.bind(this, 'font') }
        >
        {
          this.props.fontList.map(font => {
            return <option key={ id() } value={ font.fontId }>{ font.displayName }</option>
          })
        }
        </select>
      </div>
    )
  }
}
