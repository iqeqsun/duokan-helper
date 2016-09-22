import RollbarBrowser from 'rollbar-browser'

const rollbarConfig = {
  accessToken: 'e71a0654aa65437698a18bd671f549dc'
, captureUncaught: true
, captureUnhandledRejections: true
, payload: {
    environment: 'production'
  }
}

export default RollbarBrowser.init(rollbarConfig)
