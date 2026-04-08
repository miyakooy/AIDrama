export type TensorsLabImageModel = 'seedreamv5' | 'seedreamv4' | 'zimage' | 'quickedit'

export type TensorsLabVideoModel = 'seedancev2' | 'seedancev15pro' | 'seedancev1profast' | 'seedancev1'

type TensorsLabResponse<T> = {
  code: number
  msg?: string
  data?: T
}

type TensorsLabImageTaskInfo = {
  taskid: string
  url?: string[]
  image_status?: number
  error_message?: string
  width?: number
  height?: number
}

type TensorsLabVideoTaskInfo = {
  taskid: string
  url?: string[]
  task_status?: number
  message?: string
  duration?: number
  ratio?: string
  fps?: number
  resolution?: string
}

function normalizeBaseUrl(baseUrl: string) {
  let normalized = baseUrl.replace(/\/+$/, '')
  // 如果用户错误地填入了官网地址，自动修正为真正的 API 地址
  if (normalized.includes('www.tensorslab.com') || normalized.includes('tensorslab.com/models')) {
    normalized = 'https://api.tensorslab.com'
  }
  return normalized
}

function toErrorMessage(code: number, msg?: string) {
  if (code === 9000) return '亲，积分用完啦，请前往 https://tensorai.tensorslab.com/ 充值'
  return msg || '请求失败'
}

async function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('用户已取消'))
      return
    }
    const tid = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(tid)
      reject(new Error('用户已取消'))
    }, { once: true })
  })
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s)
  if (!match) return null
  const mime = match[1] || 'application/octet-stream'
  const b64 = match[2]
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

async function fetchBlobWithFallback(url: string): Promise<Blob> {
  const attempt = async (input: string) => {
    const resp = await fetch(input)
    if (!resp.ok) throw new Error(`获取图片失败: ${resp.status}`)
    return await resp.blob()
  }

  try {
    return await attempt(url)
  } catch {
    const proxied = `/__api_proxy?url=${encodeURIComponent(url)}`
    return await attempt(proxied)
  }
}

function resolveImageResolution(aspectRatio: string, resolution?: string): string {
  const base: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '4:3': { width: 1152, height: 864 },
    '3:4': { width: 864, height: 1152 },
    '3:2': { width: 1248, height: 832 },
    '2:3': { width: 832, height: 1248 },
    '21:9': { width: 1512, height: 648 },
  }

  const multipliers: Record<string, number> = { '1K': 1, '2K': 2, '4K': 4 }
  const dims = base[aspectRatio] || base['16:9']
  const mul = multipliers[(resolution || '2K').toUpperCase()] || 2

  const width = dims.width * mul
  const height = dims.height * mul
  const pixels = width * height
  if (pixels < 3_686_400) {
    const width2 = dims.width * 2
    const height2 = dims.height * 2
    return `${width2}x${height2}`
  }
  return `${width}x${height}`
}

export function isTensorsLabBaseUrl(baseUrl: string) {
  return baseUrl.includes('tensorslab.com')
}

export function isTensorsLabImageModel(model: string): model is TensorsLabImageModel {
  return model === 'seedreamv5' || model === 'seedreamv4' || model === 'zimage' || model === 'quickedit'
}

export function isTensorsLabVideoModel(model: string): model is TensorsLabVideoModel {
  return model === 'seedancev2' || model === 'seedancev15pro' || model === 'seedancev1profast' || model === 'seedancev1'
}

export async function tensorslabGenerateImage(params: {
  apiKey: string
  baseUrl: string
  model: TensorsLabImageModel
  prompt: string
  aspectRatio: string
  resolution?: string
  referenceImages?: string[]
  signal?: AbortSignal
}): Promise<{ imageUrl: string; taskId: string }> {
  const baseUrl = normalizeBaseUrl(params.baseUrl)
  const form = new FormData()
  form.append('prompt', params.prompt)
  form.append('resolution', resolveImageResolution(params.aspectRatio, params.resolution))
  if (params.model === 'seedreamv4' || params.model === 'seedreamv5') {
    form.append('category', params.model)
  }
  if (params.model === 'zimage') {
    form.append('prompt_extend', '1')
  }

  const refs = params.referenceImages?.filter(Boolean) || []
  const httpRefs = refs.filter((r) => r.startsWith('http://') || r.startsWith('https://'))
  const dataRefs = refs.filter((r) => r.startsWith('data:'))

  if (httpRefs.length === 1 && dataRefs.length === 0) {
    form.append('imageUrl', httpRefs[0])
  } else {
    const uploadRefs = [...dataRefs, ...httpRefs].slice(0, 2)
    for (let i = 0; i < uploadRefs.length; i += 1) {
      const ref = uploadRefs[i]
      if (ref.startsWith('data:')) {
        const blob = dataUrlToBlob(ref)
        if (blob) {
          form.append('sourceImage', blob, `ref_${i}.png`)
        }
      } else if (ref.startsWith('http')) {
        const blob = await fetchBlobWithFallback(ref)
        form.append('sourceImage', blob, `ref_${i}.png`)
      }
    }
  }

  const endpoint = `${baseUrl}/v1/images/${params.model === 'seedreamv5' ? 'seedreamv5' : params.model === 'seedreamv4' ? 'seedreamv4' : params.model === 'zimage' ? 'zimage' : 'quickedit'}`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: form,
    signal: params.signal,
  })

  const json = await resp.json() as TensorsLabResponse<{ taskid: string }>
  if (!resp.ok || json.code !== 1000 || !json.data?.taskid) {
    throw new Error(toErrorMessage(json.code, json.msg))
  }

  const taskId = json.data.taskid
  const imageUrl = await tensorslabPollImage(taskId, params.apiKey, baseUrl, params.signal)
  return { imageUrl, taskId }
}

async function tensorslabPollImage(taskId: string, apiKey: string, baseUrl: string, signal?: AbortSignal): Promise<string> {
  const endpoint = `${normalizeBaseUrl(baseUrl)}/v1/images/infobytaskid`
  const maxAttempts = 120
  const pollInterval = 2000

  for (let i = 0; i < maxAttempts; i += 1) {
    if (signal?.aborted) throw new Error('用户已取消')
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskid: taskId }),
      signal,
    })

    const json = await resp.json() as TensorsLabResponse<TensorsLabImageTaskInfo>
    if (!resp.ok || !json) {
      await sleep(pollInterval, signal)
      continue
    }
    if (json.code === 9000) throw new Error(toErrorMessage(json.code, json.msg))
    if (json.code !== 1000) {
      await sleep(pollInterval, signal)
      continue
    }

    const status = json.data?.image_status
    if (status === 3) {
      const url = json.data?.url?.[0]
      if (!url) throw new Error('任务完成但没有图片 URL')
      return url
    }
    if (status === 4) {
      throw new Error(json.data?.error_message || json.msg || '图片生成失败')
    }

    await sleep(pollInterval, signal)
  }
  throw new Error('图片生成超时')
}

export async function tensorslabGenerateVideo(params: {
  apiKey: string
  baseUrl: string
  model: TensorsLabVideoModel
  prompt: string
  ratio: string
  duration: number
  resolution?: string
  fps?: string
  sourceImages?: Array<{ url: string; role: 'first_frame' | 'last_frame' }>
  signal?: AbortSignal
}): Promise<{ videoUrl: string; taskId: string }> {
  const baseUrl = normalizeBaseUrl(params.baseUrl)
  const endpoint = `${baseUrl}/v1/video/${params.model}`

  const form = new FormData()
  form.append('prompt', params.prompt)
  form.append('ratio', params.ratio || '9:16')
  form.append('duration', String(Math.max(5, Math.min(15, params.duration || 5))))
  if (params.resolution) form.append('resolution', params.resolution)
  if (params.fps) form.append('fps', params.fps)

  const sources = params.sourceImages || []
  const ordered = [
    sources.find((s) => s.role === 'first_frame'),
    sources.find((s) => s.role === 'last_frame'),
  ].filter(Boolean) as Array<{ url: string; role: 'first_frame' | 'last_frame' }>

  for (let i = 0; i < Math.min(2, ordered.length); i += 1) {
    const blob = await fetchBlobWithFallback(ordered[i].url)
    form.append('sourceImage', blob, `${ordered[i].role}_${i}.png`)
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: form,
    signal: params.signal,
  })

  const json = await resp.json() as TensorsLabResponse<{ taskid: string }>
  if (!resp.ok || json.code !== 1000 || !json.data?.taskid) {
    throw new Error(toErrorMessage(json.code, json.msg))
  }

  const taskId = json.data.taskid
  const videoUrl = await tensorslabPollVideo(taskId, params.apiKey, baseUrl, params.signal)
  return { videoUrl, taskId }
}

async function tensorslabPollVideo(taskId: string, apiKey: string, baseUrl: string, signal?: AbortSignal): Promise<string> {
  const endpoint = `${normalizeBaseUrl(baseUrl)}/v1/video/infobytaskid`
  const maxAttempts = 180
  const pollInterval = 5000

  for (let i = 0; i < maxAttempts; i += 1) {
    if (signal?.aborted) throw new Error('用户已取消')
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskid: taskId, moreTaskInfo: false }),
      signal,
    })

    const json = await resp.json() as TensorsLabResponse<TensorsLabVideoTaskInfo>
    if (!resp.ok || !json) {
      await sleep(pollInterval, signal)
      continue
    }
    if (json.code === 9000) throw new Error(toErrorMessage(json.code, json.msg))
    if (json.code !== 1000) {
      await sleep(pollInterval, signal)
      continue
    }

    const status = json.data?.task_status
    if (status === 3) {
      const url = json.data?.url?.[0]
      if (!url) throw new Error('任务完成但没有视频 URL')
      return url
    }
    if (status === 4) {
      throw new Error(json.data?.message || json.msg || '视频生成失败')
    }

    await sleep(pollInterval, signal)
  }
  throw new Error('视频生成超时')
}

