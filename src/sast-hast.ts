import * as Unist from 'unist'
// @ts-ignore
import hast2mdast from 'hast-util-to-mdast'
// @ts-ignore
import mdast2hast from 'mdast-util-to-hast'

import * as Sast from './sast'
import { sast2mdast, mdast2sast } from './sast-mdast'

export function hast2sast (hast: Unist.Node): Sast.Node {
  return mdast2sast(hast2mdast(hast))
}

export function sast2hast (sast: Sast.Node): Unist.Node {
  return mdast2hast(sast2mdast(sast))
}
