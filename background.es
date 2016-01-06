'use strict'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(sender.tab ? `from a content script:${sender.tab.url}` : 'from the extension')
  chrome.fontSettings.getFontList(callback => {
    sendResponse({fontList: callback})
  })
  return true
})
