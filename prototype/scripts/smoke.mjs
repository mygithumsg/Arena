// SSR smoke test: catches module-graph / render-time errors with exact file:line
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k)
}
globalThis.document = { getElementById: () => null, documentElement: { style: { setProperty() {} } } }
globalThis.window = { addEventListener() {}, removeEventListener() {} }
const { default: React } = await import('react')
const { renderToString } = await import('react-dom/server')
const { default: App } = await import('../src/App.jsx')
const html = renderToString(React.createElement(App))
console.log('SMOKE PASS · html bytes:', html.length)
if (!html.includes('Hello')) { console.error('WARN: expected content missing'); process.exit(2) }
