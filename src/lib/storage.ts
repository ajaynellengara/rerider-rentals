import { createHash, createHmac } from 'node:crypto'

const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const hmac = (key: Buffer | string, value: string) => createHmac('sha256', key).update(value).digest()

export function getHandoverPhotoUrl(storageKey: string, expiresInSeconds = 600) {
  if (/^https?:\/\//i.test(storageKey)) return storageKey

  const accessKey = process.env.S3_ACCESS_KEY_ID
  const secretKey = process.env.S3_SECRET_ACCESS_KEY
  const bucket = process.env.S3_BUCKET_NAME
  const region = process.env.S3_REGION || 'ap-south-1'
  const endpointValue = process.env.S3_ENDPOINT
  if (!accessKey || !secretKey || !bucket || !endpointValue) return null

  const endpoint = new URL(endpointValue)
  const isAwsS3 = endpoint.hostname.endsWith('.amazonaws.com')
  const objectKey = storageKey.replace(/^\/+/, '').split('/').map(encode).join('/')
  const host = isAwsS3 ? `${bucket}.${endpoint.host}` : endpoint.host
  const basePath = endpoint.pathname.replace(/\/+$/, '')
  const canonicalUri = isAwsS3
    ? `${basePath}/${objectKey}`
    : `${basePath}/${encode(bucket)}/${objectKey}`
  const url = new URL(`${endpoint.protocol}//${host}${canonicalUri}`)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const scope = `${dateStamp}/${region}/s3/aws4_request`
  const parameters: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${accessKey}/${scope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresInSeconds)],
    ['X-Amz-SignedHeaders', 'host'],
  ]
  const canonicalQuery = parameters.map(([key, value]) => [encode(key), encode(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`).join('&')
  const canonicalRequest = `GET\n${url.pathname}\n${canonicalQuery}\nhost:${url.host}\nhost\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, 's3')
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`
  return url.toString()
}
