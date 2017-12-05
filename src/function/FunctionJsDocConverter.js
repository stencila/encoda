import doctrine from 'doctrine'
import path from 'path'
import fs from 'fs'

import FunctionConverter from './FunctionConverter'

export default class FunctionJsDocConverter extends FunctionConverter {
  import (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    return this.readFile(fromFs, from, 'utf8').then((jsdoc) => {
      const tags = doctrine.parse(jsdoc, {
        sloppy: true // allow optional parameters to be specified in brackets
      }).tags

      const func = this.loadXml()
      const funcRoot = func('function')

      function importFirst (title, property) {
        const tag = tags.filter((tag) => tag.title === title)[0]
        if (tag) funcRoot.append(func('<' + title + '>').text(tag[property || 'description']))
      }

      function importExamples () {
        const tags_ = tags.filter((tag) => tag.title === 'example')
        if (tags_.length) {
          const examples = func('<examples>')
          tags_.forEach((tag) => {
            examples.append(
              func('<example>').append(
                func('<usage>').text(tag.description)
              )
            )
          })
          funcRoot.append(examples)
        }
      }

      function importParams () {
        const tags_ = tags.filter((tag) => tag.title === 'param')
        if (tags_.length) {
          const params = func('<params>')
          tags_.forEach((tag) => {
            const param = func('<param>')
            if (tag.name) param.attr('name', tag.name)
            if (tag.type) {
              let type
              switch (tag.type.type) {
                case 'AllLiteral':
                  type = 'any'
                  break
                case 'NameExpression':
                  type = tag.type.name
                  break
                case 'TypeApplication':
                  type = tag.type.expression.name + '[' +
                         tag.type.applications.map((application) => application.name).join(',') + ']'
                  break
                case 'OptionalType':
                  type = tag.type.expression.name
                  param.append(func('<default>').text(tag.default ? tag.default : 'null'))
                  break
                default:
                  throw new Error('Unhandled @param type specification: ' + tag.type.type)
              }
              param.attr('type', type)
            }
            if (tag.description) param.append(func('<description>').text(tag.description))
            params.append(param)
          })
          funcRoot.append(params)
        }
      }

      function importReturn () {
        const tag = tags.filter((tag) => tag.title === 'return')[0]
        if (tag) {
          const returnEl = func('<return>')
          if (tag.type) {
            let type
            switch (tag.type.type) {
              case 'NameExpression':
                type = tag.type.name
                break
              default:
                throw new Error('Unhandled @return type specification: ' + tag.type.type)
            }
            returnEl.attr('type', type)
          }
          if (tag.description) returnEl.append(func('<description>').text(tag.description))
          funcRoot.append(returnEl)
        }
      }

      function importImplems () {
        const tags_ = tags.filter((tag) => tag.title === 'implem')
        if (tags_.length) {
          const implems = func('<implems>')
          tags_.forEach((tag) => {
            implems.append(func('<implem>').attr('language', tag.description))
          })
          funcRoot.append(implems)
        }
      }

      function importAuthors () {
        const tags_ = tags.filter((tag) => tag.title === 'author')
        if (tags_.length) {
          const authors = func('<authors>')
          tags_.forEach((tag) => {
            authors.append(
              func('<author>').text(tag.description)
            )
          })
          funcRoot.append(authors)
        }
      }

      importFirst('name', 'name')
      importFirst('title')
      importFirst('summary')
      importFirst('description')
      importExamples()
      importParams()
      importReturn()
      importImplems()
      importAuthors('author')

      const main = path.join(to, 'index.fun.xml')
      return this.writeFile(toFs, main, this.dumpXml(func)).then(() => {
        return main
      })
    })
  }
}
