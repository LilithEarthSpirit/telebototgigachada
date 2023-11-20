import dev from './dev.mjs'
import prod from './prod.mjs'

const environment = process.env.NODE_ENV === 'production' ? prod : dev
export default environment