let b = require('substance-bundler')
let fork = require('substance-bundler/extensions/fork')
let fs = require('fs')

const EXTERNALS = [
  'doctrine',
  'js-beautify',
  'memfs',
  'substance'
]
const TEST_EXTERNALS = EXTERNALS.concat([
  'tape'
])
const GLOBALS = {
  'doctrine': 'doctrine',
  'js-beautify': 'jsbeautify',
  'memfs': 'memfs',
  'substance': 'substance',
  'tape': 'tape'
}
const BROWSERIFY = [
  'doctrine',
  'js-beautify',
  'memfs',
  'tape'
]

b.task('default', ['clean', 'test', 'build'])

b.task('clean', () => {
  b.rm('tmp')
})

b.task('build', () => {
  b.js('./src/index.js', {
    targets: [{
      dest: './build/stencila-convert.js',
      format: 'umd',
      moduleName: 'stencilaConvert',
    }, {
      dest: './build/stencila-convert.cjs.js',
      format: 'cjs'
    }],
    external: EXTERNALS,
    globals: GLOBALS,
    json: true
  })
})

b.task('test', () => {
  b.js('./test/**/*.js', {
    target: {
      dest: './tmp/test.cjs.js',
      format: 'cjs'
    },
    external: TEST_EXTERNALS
  })
  fork(b, 'node_modules/.bin/tape', './tmp/test.cjs.js', { verbose: true })
})

b.task('browserify', () => {
  BROWSERIFY.forEach((module) => {
    if (!fs.existsSync('./tmp/' + module + '.umd.js')) {
      b.browserify('./node_modules/' + module, {
        dest: './tmp/' + module + '.umd.js',
        browserify: {
          standalone: module.replace('-', '')
        }
      })
    }
  })
})

b.task('test:browser', ['browserify'], () => {
  b.js('./test/**/*.js', {
    target: {
      dest: './tmp/test.umd.js',
      format: 'umd',
      moduleName: 'tests',
    },
    external: TEST_EXTERNALS,
    globals: GLOBALS
  })
})

b.task('cover', () => {
  b.js(['./src/index.js', './test/**/*.js'], {
    target: {
      dest: './tmp/test.cover.js',
      format: 'cjs',
      istanbul: {
        include: ['./src/**/*.js'],
        exclude: ['./test/**/*.js']
      },
    },
    external: TEST_EXTERNALS
  })
  fork(b, 'node_modules/.bin/istanbul', 'cover ./tmp/test.cover.js')
})
