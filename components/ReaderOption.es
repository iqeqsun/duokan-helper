import React from 'react'
import BackgroundSelector from './BackgroundSelector.es'
import FontSelector from './FontSelector.es'

export default class ReaderOption extends React.Component {
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
