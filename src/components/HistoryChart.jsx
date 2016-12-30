'use strict'

import React from 'react'
import {
  LineChart
, XAxis
, YAxis
, CartesianGrid
, Tooltip
, Legend
, Line
} from 'recharts'

export default class HistoryChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      timeline: this.props.timeline.map(x => {
        let time = new Date(x.Timestamp * 1000)
          , year = time.getFullYear()
          , month = `0${ time.getMonth() + 1 }`.substr(-2)
          , day = `0${ time.getDate() }`.substr(-2)
        return Object.assign({}, x, {
          Timestamp: `${ year }-${ month }-${ day }`
        })
      })
    }
  }
  render() {
    return (
      <LineChart
        width={ 480 } height={ 270 }
        data={ this.state.timeline }
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <XAxis dataKey="Timestamp" name="日期" />
        <YAxis dataKey="Price" name="价格(元)" />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        <Line dataKey="Price" name="价格" unit="元" dot={ false }/>
      </LineChart>
    )
  }
}
