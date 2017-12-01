const doctrine = require('doctrine')
const {html} = require('js-beautify')
const beautifyHtml = html

const FunctionConverter = require('./FunctionConverter')

class FunctionJsDocConverter extends FunctionConverter {

  import (from, path, to, name) {
    const jsdoc = from.readFileSync(path, 'utf8')

    const tags = doctrine.parse(jsdoc, {
      sloppy: true // allow optional parameters to be specified in brackets
    }).tags

    const {dom, $$} = this._createDOM()

    function importFirst(title, property) {
      const tag = tags.filter((tag) => tag.title === title)[0]
      if (tag) dom.append($$(title).text(tag[property || 'description']))
    }

    function importExamples() {
      const examples = $$('examples')
      tags.filter((tag) => tag.title === 'example').forEach((tag) => {
        examples.append(
          $$('example').append(
            $$('usage').text(tag.description)
          )
        )
      })
      if (examples.children.length) dom.append(examples)
    }

    function importParams() {
      const params = $$('params')
      tags.filter((tag) => tag.title === 'param').forEach((tag) => {
        const param = $$('param')
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
              param.append($$('default').text(tag.default ? tag.default : 'null'))
              break
            default:
              throw new Error('Unhandled parameter type: ' + tag.type.type)
          }
          param.attr('type', type)
        }
        if (tag.description) param.append($$('description').text(tag.description))
        params.append(param)
      })
      if (params.children.length) dom.append(params)
    }

    function importReturn() {
      const tag = tags.filter((tag) => tag.title === 'return')[0]
      if (tag) {
        const returnEl = $$('return')
        if (tag.type) {
          let type
          switch (tag.type.type) {
            case 'NameExpression':
              type = tag.type.name
              break
            default:
              throw new Error('Unhandled parameter type: ' + tag.type.type)
          }
          returnEl.attr('type', type)
        }
        if (tag.description) returnEl.append($$('description').text(tag.description))
        dom.append(returnEl)
      }
    }

    function importImplems() {
      const implems = $$('implems')
      tags.filter((tag) => tag.title === 'implem').forEach((tag) => {
        implems.append($$('implem').attr('language', tag.description))
      })
      if (implems.children.length) dom.append(implems)
    }

    function importAuthors() {
      const authors = $$('authors')
      tags.filter((tag) => tag.title === 'author').forEach((tag) => {
        authors.append(
          $$('author').text(tag.description)
        )
      })
      if (authors.children.length) dom.append(authors)
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

    const main = name + '.fun.xml'
    const xml = beautifyHtml(dom.serialize(), {
      void_elements: [] // No, 'self-closing', void tags for XML
    })
    to.writeFileSync(main, xml, 'utf8')

    return Promise.resolve(main)
  }

}

module.exports = FunctionJsDocConverter
