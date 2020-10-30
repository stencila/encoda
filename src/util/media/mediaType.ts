/**
 * @module util
 */

import path from 'path'
import url from 'url'

type MediaType = 'audio' | 'image' | 'video'

const audioExts = ['aac', 'aiff', 'alac', 'dsd', 'flac', 'mp3', 'ogg', 'wav']
const imageExts = [
  'avif',
  'bmp',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'tiff',
  'webp',
]
const videoExts = [
  '3gp',
  'avi',
  'flv',
  'vob',
  'ogv',
  'mov',
  'mp4',
  'mpeg',
  'webm',
]

/**
 * Return the media type from a URL.
 *
 * Used to determine if a URL or local file should be considered
 * an `ImageObject`, `AudioObject`, or `VideoObject`.
 */
export function mediaType(
  mediaUrl: string,
  fallback: MediaType = 'image'
): MediaType {
  let pathname
  try {
    ;({ pathname } = new url.URL(mediaUrl))
  } catch (error) {
    pathname = mediaUrl
  }
  const ext = path.extname(pathname ?? '').slice(1)
  if (audioExts.includes(ext)) return 'audio'
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  return fallback
}
