import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
// No core-js: every browser the app supports (2020 or newer) has what the code uses, and the full polyfill
// set was the largest part of the first download (slow on poor connections).

import App from './App'
import store from './store'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
