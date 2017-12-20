const doctrine = require('doctrine')
const fs = require('fs')
const tmp = require('tmp')

const FunctionConverter = require('./FunctionConverter')

class FunctionJsDocConverter extends FunctionConverter {
  canImport (pathFrom) {
    return Promise.resolve(pathFrom.slice(-8) === '.fun.txt')
  }

  canExport (pathTo) {
    return Promise.resolve(false)
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || tmp.tmpNameSync({postfix: '.fun.xml'})
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this.readFile(pathFrom, volumeFrom).then((jsdoc) => {
      const tags = doctrine.parse(jsdoc, {
        sloppy: true // allow optional parameters to be specified in brackets
      }).tags

      return this.createDom().then((dom) => {
        const func = dom('function')

        function importFirst (title, property) {
          const tag = tags.filter((tag) => tag.title === title)[0]
          if (tag) func.append(dom('<' + title + '>').text(tag[property || 'description']))
        }

        function importExamples () {
          const tags_ = tags.filter((tag) => tag.title === 'example')
          if (tags_.length) {
            const examples = dom('<examples>')
            tags_.forEach((tag) => {
              examples.append(
                dom('<example>').append(
                  dom('<usage>').text(tag.description)
                )
              )
            })
            func.append(examples)
          }
        }

        function importParams () {
          const tags_ = tags.filter((tag) => tag.title === 'param')
          if (tags_.length) {
            const params = dom('<params>')
            tags_.forEach((tag) => {
              const param = dom('<param>')
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
                    let defaultType = tag.default ? type : 'null'
                    let defaultValue = tag.default ? tag.default : 'null'
                    param.append(
                      dom('<default>').attr('type', defaultType).text(defaultValue)
                    )
                    break
                  default:
                    throw new Error('Unhandled @param type specification: ' + tag.type.type)
                }
                param.attr('type', type)
              }
              if (tag.description) param.append(dom('<description>').text(tag.description))
              params.append(param)
            })
            func.append(params)
          }
        }

        function importReturn () {
          const tag = tags.filter((tag) => tag.title === 'return')[0]
          if (tag) {
            const returnEl = dom('<return>')
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
            if (tag.description) returnEl.append(dom('<description>').text(tag.description))
            func.append(returnEl)
          }
        }

        function importImplems () {
          const tags_ = tags.filter((tag) => tag.title === 'implem')
          if (tags_.length) {
            const implems = dom('<implems>')
            tags_.forEach((tag) => {
              implems.append(dom('<implem>').attr('language', tag.description))
            })
            func.append(implems)
          }
        }

        function importAuthors () {
          const tags_ = tags.filter((tag) => tag.title === 'author')
          if (tags_.length) {
            const authors = dom('<authors>')
            tags_.forEach((tag) => {
              authors.append(
                dom('<author>').text(tag.description)
              )
            })
            func.append(authors)
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

        return this.dumpXml(dom).then((xml) => {
          return this.writeFile(pathTo, xml, volumeTo).then(() => {
            return pathTo
          })
        })
      })
    })
  }
}

module.exports = FunctionJsDocConverter
