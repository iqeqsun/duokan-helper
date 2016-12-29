'use strict'

export const NAME = 'duokan-helper'
export const API = 'http://duokan.blackglory.me'
export const VERSION = 'v1'
export const BASEPATH = `${ API }/${ VERSION }`
export const KEY = Symbol(NAME)

export const MDC = {
  BLUE: '#2196F3'
, GREEN: '#4CAF50'
, YELLOW: '#FFEB3B'
}

export const COLOR = {
  BAD: 'inherit'
, OKAY: MDC.BLUE
, AWESOME: MDC.GREEN
, NONE: 'inherit'
}

export const PASS = () => {}

export const id = (() => {
  function* gen() {
    for(let i = 0;;) {
      yield ++i
    }
  }
  let g = gen()
  return () => g.next().value
})()
