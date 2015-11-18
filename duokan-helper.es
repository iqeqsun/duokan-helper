'use strict'

import * as _ from 'lodash'
import * as qwest from 'qwest'

const API = 'http://127.0.0.1:8080'

console.log(`duokan-helper loaded.`)

let pathname = _.rest(new URL(document.URL).pathname.split('/'))

function isStrNumber(v) {
  return /^\d+$/.test(v)
}

if (_.first(pathname) === 'book') {
  let id = pathname[1]
  if (isStrNumber(id)) {
    qwest
      .get(`${API}/book/${id}`)
      .then((xhr, data) => {
        _.each(data, (timeline) => {
          timeline.Price = Number(timeline.Price)
        })
        let min = _.reduce(data, (min, timeline) => {
          return min.Price > timeline.Price ? timeline : min
        }).Price
        let i = document.createElement('i')
        i.textContent = `历史最低价¥ ${min}`
        document.querySelector('.price').appendChild(i)
      })
      .catch((e) => {
        console.error(e)
      })
  }
}
