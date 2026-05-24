import test from 'node:test'
import assert from 'node:assert/strict'

import { trackEvent } from '../lib/analytics.mjs'

test('trackEvent safely skips when GA is unavailable', () => {
  const originalWindow = globalThis.window
  delete globalThis.window

  try {
    assert.equal(trackEvent('database_filter', { filter_type: 'band' }), false)
  } finally {
    if (originalWindow) {
      globalThis.window = originalWindow
    }
  }
})

test('trackEvent sends GA4 event payloads and drops empty params', () => {
  const calls = []
  const originalWindow = globalThis.window

  globalThis.window = {
    gtag: (...args) => calls.push(args),
  }

  try {
    const sent = trackEvent('database_filter', {
      filter_type: 'band',
      filter_value: '2.4GHz',
      ignored: undefined,
      empty: '',
    })

    assert.equal(sent, true)
    assert.deepEqual(calls, [
      ['event', 'database_filter', { filter_type: 'band', filter_value: '2.4GHz' }],
    ])
  } finally {
    if (originalWindow) {
      globalThis.window = originalWindow
    } else {
      delete globalThis.window
    }
  }
})
