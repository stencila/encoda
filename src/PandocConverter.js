const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

const Converter = require('./Converter')
const pandoc = require('./helpers/pandoc')

class PandocConverter extends Converter {
  options () {
    return {
      from: 'json',
      to: 'json',
      eol: 'native', // Line endings : --eol=crlf|lf|native
      complete: true
    }
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    // Call Pandoc to convert `options.from` format to Pandoc JSON
    let args = [
      '--from', options.from,
      '--to', 'json'
    ]
    if (options.importArgs) args = args.concat(options.importArgs)
    const pathTemp = '/temp.json'
    const volumeTemp = new memfs.Volume()
    await this._callPandoc(path, volume, pathTemp, volumeTemp, args)

    // Read Pandoc JSON from temporary file into a Pandoc document
    const json = await this.readFile(pathTemp, volumeTemp, options)
    const pandoc = JSON.parse(json)

    // Generate an executable document from the Pandoc document
    let doc
    if (false) {
      doc = {
        type: 'Document',
        body: []
      }
      for (let block of pandoc.blocks) {
        doc.body.push(this._importNode(block))
      }
    } else {
      doc = pandoc
    }

    return doc
  }

  async export (doc, path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    // Generate a Pandoc document from an executable document
    let pandoc
    if (false) {
      pandoc = {
        'pandoc-api-version': [ 1, 17, 3 ],
        meta: {},
        blocks: []
      }
      for (let node of doc.body) {
        pandoc.blocks.push(this._exportNode(node))
      }
    } else {
      pandoc = doc
    }

    // Write to Pandoc document to a temporary file
    const json = JSON.stringify(pandoc, null, '  ')
    const pathTemp = '/temp.json'
    const volumeTemp = new memfs.Volume()
    await this.writeFile(pathTemp, json, volumeTemp, options)

    // Call Pandoc to convert Pandoc JSON to `options.to` format
    let args = [
      '--from', 'json',
      '--to', options.to
    ]
    if (options.eol) args = args.concat(['--eol', options.eol])
    if (options.complete) {
      args = args.concat(['--standalone'])
      if (options.template) {
        args = args.concat(['--template', options.template])
      }
    }
    if (options.exportArgs) args = args.concat(options.exportArgs)
    await this._callPandoc(pathTemp, volumeTemp, path, volume, args)
  }

  async _callPandoc (pathFrom, volumeFrom, pathTo, volumeTo, args) {
    // If volumeTo is the local filesystem then get pandoc to output
    // to there directly, otherwise write to the (virtual) filesystem
    let output = true
    if (volumeTo === fs) {
      mkdirp(path.dirname(pathTo))
      args = args.concat(['--output', pathTo])
      output = false
    }
    // If volumeFrom is the local filesystem then get pandoc to read
    // from there directly, otherwise read from the (virtual) filesystem
    let content
    if (volumeFrom === fs) {
      args = args.concat([pathFrom])
      content = ''
    } else {
      content = await this.readFile(pathFrom, volumeFrom)
    }

    // Read, spawn, write...
    const result = await pandoc.spawn(content, args)
    if (output) await this.writeFile(pathTo, result, volumeTo)

    return pathTo
  }

  /**
   * Import a Pandoc document node by converting it
   * to an executable document node.
   *
   * This method should do the inverse of `_exportNode`
   *
   * @param  {Object} node Pandoc document node
   * @return {Object}      Executable document node
   */
  _importNode (node) {
    switch (node.t) {
      case 'Str':
        return {
          type: 'String',
          data: node.c
        }
      default:
        let nodes = []
        if (node.c) {
          for (let child of node.c) {
            nodes.push(this._importNode(child))
          }
        }
        return {
          type: node.t,
          nodes
        }
    }
  }

  /**
   * Export an executable document node by converting it
   * to a Pandoc document node.
   *
   * This method should do the inverse of `_importNode`
   *
   * @param  {Object} node Executable document node
   * @return {Object}      Pandoc document node
   */
  _exportNode (node) {
    switch (node.type) {
      case 'String':
        return {
          t: 'Str',
          c: node.data
        }
      default:
        let c = []
        if (node.nodes) {
          for (let child of node.nodes) {
            c.push(this._exportNode(child))
          }
        }
        return {
          t: node.type,
          c
        }
    }
  }
}

module.exports = PandocConverter
