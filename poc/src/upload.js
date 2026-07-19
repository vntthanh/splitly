import { AppError } from './errors.js'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml'])

const readBody = async (request, limit) => {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) throw new AppError(413, 'FILE_TOO_LARGE', `File must not exceed ${limit} bytes`)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const signatureMatches = (buffer, mimeType) => {
  if (mimeType === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  if (mimeType === 'image/svg+xml') {
    return /^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(buffer.subarray(0, 512).toString('utf8'))
  }
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
}

export const parseImageUpload = async (request, maxFileSizeBytes) => {
  const contentType = request.headers['content-type'] ?? ''
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!contentType.startsWith('multipart/form-data') || !boundaryMatch) {
    throw new AppError(415, 'INVALID_CONTENT_TYPE', 'Use multipart/form-data with a file field')
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2]
  const body = await readBody(request, maxFileSizeBytes + 64 * 1024)
  const marker = Buffer.from(`--${boundary}`)
  const headerSeparator = Buffer.from('\r\n\r\n')
  let cursor = 0

  while ((cursor = body.indexOf(marker, cursor)) !== -1) {
    const headerStart = cursor + marker.length + 2
    const headerEnd = body.indexOf(headerSeparator, headerStart)
    if (headerEnd === -1) break
    const headers = body.subarray(headerStart, headerEnd).toString('utf8')
    const disposition = headers.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i)
    const type = headers.match(/content-type:\s*([^\r\n;]+)/i)?.[1]?.toLowerCase()
    const nextBoundary = body.indexOf(marker, headerEnd + headerSeparator.length)
    if (nextBoundary === -1) break

    if (disposition?.[1] === 'file' && disposition[2] !== undefined) {
      const file = body.subarray(headerEnd + headerSeparator.length, nextBoundary - 2)
      if (!type || !ALLOWED_TYPES.has(type)) {
        throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only JPG, JPEG, PNG and SVG images are accepted')
      }
      if (file.length === 0) throw new AppError(400, 'EMPTY_FILE', 'Uploaded file is empty')
      if (file.length > maxFileSizeBytes) {
        throw new AppError(413, 'FILE_TOO_LARGE', `File must not exceed ${maxFileSizeBytes} bytes`)
      }
      if (!signatureMatches(file, type)) {
        throw new AppError(415, 'INVALID_IMAGE_SIGNATURE', 'File content does not match its declared image type')
      }
      return { buffer: file, mimeType: type, size: file.length }
    }
    cursor = nextBoundary
  }

  throw new AppError(400, 'FILE_REQUIRED', 'Multipart field "file" is required')
}
