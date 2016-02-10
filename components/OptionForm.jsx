import React from 'react'
import update from 'react-addons-update'
import _ from 'lodash'
import {COLOR} from '../Common.jsx'

export default class OptionForm extends React.Component {
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
    OptionForm.updateDOM = this.updateDOM
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
