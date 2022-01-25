import qs from 'qs'

export let Http = {
    /* 默认参数  */
    options() {
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
    },
    /* get请求 */
    get(url, query, options = {}) {
        // query在进行传递的时候可以直接传一个键值对，会自动 qs.stringify 话
        let queryString = typeof query === 'object' ? `?${qs.stringify(query)}` : query
        return new Promise((resolve, reject) => {
            // 将查询字符串拼接到 url 后面
            url += queryString
            // 将用户传递的 options 和 默认的 options 进行合并（优先保留用户提供的参数）
            let finalOptions = {...this.options(), ...options}
            fetch(url, finalOptions).then(res => res.json()).then(resolve).catch(reject)
        })
    },
    /* post方式 */
    post(url, params, options = {}) {
        // 将用户提供的参数和默认的参数进行合并
        let finalOptions = {...this.options(), ...{method: 'POST'}, ...options}
        // 自动根据提供的 Content-Type 处理类型参数
        // 如果是 json 类型会进行 JSON.stringify
        // 如果是表单类型会进行 qs.stringify
        finalOptions.body = this.handleContentType(finalOptions.headers[`Content-Type`], params)
        return new Promise((resolve, reject) => {
            // post 请求其实也支持拼接 query 串（虽然这种写法比较另类）
            if (options.query) fetch(url + '?' + qs.stringify(options.query), finalOptions).then(res => res.json()).then(resolve).catch(reject)
            else fetch(url, finalOptions).then(res => res.json()).then(resolve).catch(reject)
        })
    },
    /* 请求/加载文件 */
    fetchFile(url, fileType, options) {
        // 将默认的参数和用户提供的参数进行合并
        let finalOptions = {...this.options(), ...options}
        return new Promise((resolve, reject) => {
            fetch(url, finalOptions).then(res => {
                if (!res.ok) throw new Error('file load error')
                switch (fileType) {
                    // 对于文本或者是图片类型的文件，使用 blob() 方法
                    case 'text':
                    case 'image':
                        return res.blob()
                    // 如果是视频或者音频类型的问题，使用 arrayBuffer
                    case 'video':
                    case 'audio':
                        return res.arrayBuffer()
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
                        reader.readAsText(blobOrBuffer, options && options.encoding || 'UTF-8')
                       // 文本加载完成后进行 resolve
                        reader.onload = () => { resolve(reader.result) }
                        break
                    case 'image':
                        // 如果是图片类型，返回图片 blob 链接
                        resolve(URL.createObjectURL(blobOrBuffer))
                        break
                    case 'video':
                    case 'audio':
                        // 如果是媒体类型，转为 blob 后返回链接
                        let blob = new Blob([blobOrBuffer], { type: `${fileType}/*` })
                        resolve(URL.createObjectURL(blob))
                        break
                    default:
                        // 其他一律按照 blob 方式进行处理
                        resolve(URL.createObjectURL(blobOrBuffer))
                        break
                }
            }).catch(reject)
        })
    },
    /* 上传文件  */
    upload(url, formData, options) {
        // 将用户的参数和默认的参数进行合并
        let finalOptions = { ...this.options(), ...options, body: formData, method: 'POST' }
        // 当你发送上传文件类的请求时候，不要手动去写 Content-Type，浏览器会自动帮你完成这一工作
        delete finalOptions.headers[`Content-Type`]
        // 其余行为和普通请求类型, 无非就是采用 formData 的方式进行请求
        return this.post(url, formData, finalOptions)
    },
    handleContentType(contentType, params) {
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
}

