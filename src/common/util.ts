import * as qs from 'qs'

type JavaScriptValue = JavaScriptObject | generalJavaScriptFunc | string | null | undefined | number | boolean | symbol | Array<any> | FormData

interface JavaScriptObject {
    [key: string | number | symbol]: JavaScriptValue
}

interface fetchFileResponse {
    [key:string | number | symbol]:  (() => FormData) | (() => ArrayBuffer) | (() => Blob)
}

type generalJavaScriptFunc = (args: unknown []) => unknown

type httpFetchOptions = JavaScriptObject

type httpFetchUrl = string

type httpFetchQuery = JavaScriptObject | string

/**
 * 完全基于 fetch 构建的 http 请求库
 */
export class Http {
    constructor (options ?: httpFetchOptions) {
        options && this.setDefaultOptions(options)
    }
    /* 默认参数  */
    protected getDefaultOptions():httpFetchOptions {
        return {
            method: 'GET', // 默认是 get 请求
            mode: 'cors', // 默认采用 cors
            cache: 'no-cache', // no-cache 模式
            headers: {
                'Content-Type': 'application/json', // 默认采用 json 方式进行请求
                'authorization': '5754415b44514b555343443a50372e57443d26553c' // 请求应该携带的 token
            },
            body: null // 默认不传递请求体
        }
    }
    public setDefaultOptions (options:httpFetchOptions) {
        let defaultOptions = this.getDefaultOptions()
        this.getDefaultOptions = function () {
            return this.mergeOptions(options, defaultOptions)
        }
    }
    /* get请求 */
    public get(url: httpFetchUrl, query: httpFetchQuery = '', options:httpFetchOptions = {}) {
        // query在进行传递的时候可以直接传一个键值对，会自动 qs.stringify 话
        let queryString = typeof query === 'object' ? `?${qs.stringify(query)}` : query
        return new Promise((resolve, reject) => {
            // 将查询字符串拼接到 url 后面
            url += queryString
            // 将用户传递的 options 和 默认的 options 进行合并（优先保留用户提供的参数）
            let finalOptions = this.mergeOptions(options)
            fetch(url, finalOptions).then(res => res.json()).then(resolve).catch(reject)
        })
    }
    /* post方式 */
    public post(url: httpFetchUrl, params: JavaScriptObject | FormData, options:httpFetchOptions = {}, isUpload:boolean = false) {
        // 将用户提供的参数和默认的参数进行合并
        let finalOptions:httpFetchOptions = isUpload ? options : { ...this.mergeOptions(options), ...{ method: 'POST' } }
        // 自动根据提供的 Content-Type 处理类型参数
        // 如果是 json 类型会进行 JSON.stringify
        // 如果是表单类型会进行 qs.stringify
        finalOptions.body = (
            this.handleContentType((finalOptions.headers as { [key:string]: string })[`Content-Type`], params as JavaScriptObject)
        )
        return new Promise((resolve, reject) => {
            // post 请求其实也支持拼接 query 串（虽然这种写法比较另类）
            if (options.query) fetch(url + '?' + qs.stringify(options.query), finalOptions).then(res => res.json()).then(resolve).catch(reject)
            else fetch(url, finalOptions).then(res => res.json()).then(resolve).catch(reject)
        })
    }
    /* 请求/加载文件 */
    public fetchFile(url: httpFetchUrl, fileType ?: string, options ?:httpFetchOptions) {
        // 将默认的参数和用户提供的参数进行合并
        let finalOptions = this.mergeOptions(options || {})
        return new Promise((resolve, reject) => {
            fetch(url, finalOptions).then((res: Response | fetchFileResponse) => {
                if (!res.ok) throw new Error('file load error')
                switch (fileType) {
                    case 'video':
                    case 'audio':
                        return (res as fetchFileResponse).arrayBuffer()
                    // 如果都不是，采用 blob 的方式，支持用户进行下载等操作
                    default:
                        return res.blob()
                }
            }).then(blobOrBuffer => {
                switch (fileType) {
                    case 'text':
                        // 如果是读取文本类型的文件，会使用 fileReader 来读取文件
                        // 默认采用 UTF-8 编码方式，如果需要使用其他方式，可以提供 options 里的 encoding 字段
                        let reader = new FileReader()
                        reader.readAsText(blobOrBuffer as unknown as Blob, options && (options.encoding as string) || 'UTF-8')
                       // 文本加载完成后进行 resolve
                        reader.onload = () => { resolve(reader.result) }
                        break
                    case 'image':
                        // 如果是图片类型，返回图片 blob 链接
                        resolve(URL.createObjectURL(blobOrBuffer as unknown as Blob))
                        break
                    case 'video':
                    case 'audio':
                        // 如果是媒体类型，转为 blob 后返回链接
                        let blob = new Blob([blobOrBuffer as BlobPart], { type: `${fileType}/*` })
                        resolve(URL.createObjectURL(blob))
                        break
                    default:
                        // 其他一律按照 blob 方式进行处理
                        resolve(URL.createObjectURL(blobOrBuffer as unknown as Blob))
                        break
                }
            }).catch(reject)
        })
    }
    /* 上传文件  */
    public upload(url: httpFetchUrl, formData: FormData, options ?: httpFetchOptions) {
        // 将用户的参数和默认的参数进行合并
        let finalOptions: JavaScriptObject = { ...this.mergeOptions(options || {}), body: formData, method: 'POST' }
        // 当你发送上传文件类的请求时候，不要手动去写 Content-Type，浏览器会自动帮你完成这一工作
        delete (finalOptions.headers as JavaScriptObject)[`Content-Type`]
        // 其余行为和普通请求类型, 无非就是采用 formData 的方式进行请求
        return this.post(url, formData, finalOptions, true)
    }
    private handleContentType(contentType: string | undefined | null, params: JavaScriptObject) {
        // 如果是传递文件的方式，直接不做处理
        if(!contentType) return params
        // 如果是 json 格式的数据
        if (contentType.indexOf('application/json') > -1) {
            return JSON.stringify(params)
        } else if (contentType.indexOf('x-www-form-urlencoded') > -1) {
            // 如果是 form 格式的数据
            return qs.stringify(params)
        }
    }
    private mergeOptions (options: httpFetchOptions, defaultOptions = this.getDefaultOptions()) {
        if(!options) return defaultOptions
        let finalHeaders =  { ...(defaultOptions.headers as JavaScriptObject), ...(options.headers as JavaScriptObject || {})}
        return {
            ...defaultOptions,
            ...options,
            headers: Http.updateFunctionalOptions(finalHeaders)
        }
    }
    protected static updateFunctionalOptions (options: httpFetchOptions) {
        return Object.keys(options).reduce((prev,current, _) => {
            let value = options[current]
            return { ...prev, [current]: typeof value === 'function' ? (value as () => unknown)() : value }
        },{})
    }
}

