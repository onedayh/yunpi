class request {
    constructor() {
        //设置全局请求头
        this._header = {
            'content-type': 'application/x-www-form-urlencoded'
        }
    }

    /**
     * 设置统一的异常处理
     */
    setErrorHandler(handler) {
        this._errorHandler = handler;
    }

    /**
     * GET类型的网络请求
     */
    getRequest(url, data, header = this._header) {
        return this.requestAll(url, data, header, 'GET')
    }

    /**
     * DELETE类型的网络请求
     */
    deleteRequest(url, data, header = this._header) {
        return this.requestAll(url, data, header, 'DELETE')
    }

    /**
     * PUT类型的网络请求
     */
    putRequest(url, data, header = this._header) {
        return this.requestAll(url, data, header, 'PUT')
    }

    /**
     * POST类型的网络请求
     */
    postRequest(url, data, header = this._header) {
        return this.requestAll(url, data, header, 'POST')
    }

    /**
     * 网络请求
     */
    requestAll(url, data, header, method) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: url,
                data: data,
                header: Object.assign({}, {
                    'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
                    ...header
                }),
                method: method,
                success: (res => {
                    if (res.statusCode === 200) {
                        //200: 服务端业务处理正常结束
                        const code = res.data.code;
                        if (!res.data.success && (code === "loginFirst" || code === "loginError" || code === "loginOther")) {
                            //这里重定向即可，不需要reject
							wx.removeStorageSync('isLogin');
							wx.redirectTo({
								url: `/pages/grantAuthor/grantAuthor`
							})
                        } else {
                            resolve(res)
                        }

                    } else { //接口异常
                        //其它错误，提示用户错误信息
                        if (this._errorHandler != null) {
                            //如果有统一的异常处理，就先调用统一异常处理函数对异常进行处理
                            this._errorHandler(res)
                        }
                        //这里其实也可以不reject，后端出异常基本返回的是页面代码
                        reject(res)
                    }
                }),
                fail: (res => {
                    if (this._errorHandler != null) {
                        this._errorHandler(res)
                    }
                    reject(res)
                })
            })
        })
    }
}

export default request