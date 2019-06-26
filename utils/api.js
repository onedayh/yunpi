import request from './request.js'
import newApi from './newApi.js'

class api {
    constructor() {
        this._baseUrl = 'https://ceshi.shushangyun.com';
        // this._baseUrl = 'https://www.iyunpi.cn';
        // this._baseUrl = 'https://special.shushangyun.com';
        // this._baseUrl = 'https://sevenicon.taranada.cn';
        this._request = new request;
        this._request.setErrorHandler(this.errorHander)
    }

    /**
     * 统一的异常处理方法
     */
    errorHander(res) {
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })
    }
	
	/*
	**********************  	2端公用    **********************
	*/
	// 商品卡信息
	getCardInfo(cardId, userId){
		const data = {
			cardId: cardId,
			userId: userId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/product/card-detail.htm', data).then(res => res.data)
	}
	
	// 店铺
	getShopCard(){
		return this._request.postRequest(this._baseUrl + '/wxa/seller/organization-card.htm').then(res => res.data)
	}
	
	// 销售卡片
	getSalerData(userId, salerId){
		const data = {
			userId: userId,
			salerId: salerId
		}
		return this._request.getRequest(this._baseUrl + '/wxa/seller/sale-card.htm', data).then(res => res.data)
	}
	
	// 退出登录
	loginOut(){
		return this._request.postRequest(this._baseUrl + '/wxa/logout.htm').then(res => res.data)
	}
	
	
	
	
	
	
	/*
	**********************  	客户端    **********************
	*/

    //首页装饰
    // getIndex(appId) {
    //     return this._request.getRequest(this._baseUrl + '/wxa/index.htm?appId=' + appId).then(res => res.data)
    // }

    //商品卡详情
    productDetail(cardId) {
        const data = {
			cardId: cardId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/product/detail.htm', data).then(res => res.data)
    }

    //加入购物车
    addShopCart(stock) {
        const data = {
            stock: stock
        }
        return this._request.postRequest(this._baseUrl + '/wxa/cart/add-cart.htm', data).then(res => res.data)
    }

    //收藏商品
    collectGoods(cardId) {
        const data = {
			cardId: cardId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/collect/insert-collect.htm', data).then(res => res.data)
    }

    //取消收藏商品
    cancelCollect(cardId) {
        const data = {
			cardId: cardId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/collect/delete-collect.htm', data).then(res => res.data)
    }

    //订单列表
    orderList(orderStatus, page) {
        return this._request.getRequest(`${this._baseUrl}/wxa/order/order-list.htm?orderStatus=${orderStatus}&page=${page}&pageSize=5`).then(res => res.data)
    }

    //支付列表
    payList() {
        return this._request.getRequest(this._baseUrl + '/wxa/order/pay-type-list.htm').then(res => res.data)
    }

    //订单支付
    orderPay(reservationId, accountId) {
        const data = {
            reservationId: reservationId,
            accountId: accountId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/order/wait-to-verify.htm', data).then(res => res.data)
    }

    //订单详情
    orderDetail(reservationId) {
        return this._request.getRequest(`${this._baseUrl}/wxa/order/detail.htm?reservationId=${reservationId}`).then(res => res.data)
    }

    //确认订单渲染
    checkOut(detailCarIds) {
        const data = {
            detailCarIds: detailCarIds
        }
        return this._request.postRequest(this._baseUrl + '/wxa/order/checkout.htm', data).then(res => res.data)
    }

    //创建订单
    createOrder(detailCarIds, addressId) {
        const data = {
            detailCarIds: detailCarIds,
            addressId: addressId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/order/create-order.htm', data).then(res => res.data)
    }

    delOrder(reservationId) {
        const data = {
            reservationId: reservationId
        }
        return this._request.postRequest(this._baseUrl + '/wxa/order/delete-order.htm', data).then(res => res.data)
    }
	
	cancelOrder(reservationId) {
		const data = {
			reservationId: reservationId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/order/cancel.htm', data).then(res => res.data)
	}
	
	// 发送验证码
	sendVcode(phone) {
		const data = {
			phone: phone
		}
		return this._request.postRequest(this._baseUrl + '/wxa/sms-code.htm', data).then(res => res.data)
	}
	
	// 校验验证码
	checkVcode(vCode) {
		const data = {
			code: vCode
		}
		return this._request.postRequest(this._baseUrl + '/wxa/sms-validate.htm', data).then(res => res.data)
	}
	
	// 登陆小程序
	login(code) {
		const data = {
			wxacode: code
		}
		return this._request.getRequest(this._baseUrl + '/wxa/loginwxa.htm', data).then(res => res.data)
	}
	
	// 门店列表
	// getStoreList() {
	//     return this._request.getRequest(this._baseUrl + '/wxa/seller/store-list.htm').then(res => res.data)
	// },
	
	// 客服列表
	getImList() {
		return this._request.getRequest(this._baseUrl + '/wxa/seller/user-list.htm').then(res => res.data)
	}
	
	// 注册新的客户
	register(data) {
		return this._request.postRequest(this._baseUrl + '/wxa/register.htm', data).then(res => res.data)
	}
	
	// 商品列表
	getGoodsList(data) {
		return this._request.getRequest(this._baseUrl + '/wxa/product/product-list.htm', data).then(res => res.data)
	}
	
	// 商品分类列表
	getFilterList() {
		return this._request.getRequest(this._baseUrl + '/wxa/product/category.htm').then(res => res.data)
	}
	
	// 收藏 or 取消(删除)商品
	handleCollect(done, cardId) {
		// done=true代表已收藏，操作取消收藏
		const data = {
			cardId: cardId
		}
		return this._request.postRequest(`${this._baseUrl}/wxa/collect/${done ? 'delete' : 'insert'}-collect.htm`, data).then(res => res.data)
	}
	
	// 购物车列表
	getShopcarList() {
		return this._request.getRequest(this._baseUrl + '/wxa/cart/get-cart.htm').then(res => res.data)
	}
	
	// 修改购物车商品数量
	changeShopcarCount(data) {
		return this._request.getRequest(this._baseUrl + '/wxa/cart/edit-cart.htm', data).then(res => res.data)
	}
	
	// 删除购物车商品
	deleteShopcar(detailCarId) {
		const data = {
			detailCarId: detailCarId
		}
		return this._request.getRequest(this._baseUrl + '/wxa/cart/delete-cart.htm', data).then(res => res.data)
	}
	
	// 收藏夹列表
	getColList(data) {
		return this._request.getRequest(this._baseUrl + '/wxa/collect/grid-collect.htm', data).then(res => res.data)
	}
	
	// 浏览历史
	getHistory(data) {
		return this._request.getRequest(this._baseUrl + '/wxa/history.htm', data).then(res => res.data)
	}
	
	// 收货列表
	getAddressList() {
		return this._request.getRequest(this._baseUrl + '/wxa/address/grid-receive-address.htm').then(res => res.data)
	}
	
	// 新增/修改/设置默认收货地址
	setAddress(data) {
		return this._request.postRequest(this._baseUrl + '/wxa/address/update-receive-address.htm', data).then(res => res.data)
	}
	
	// 删除地址
	deconsteAddress(addressId) {
		const data = {
			addressId: addressId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/address/deconste-receive-address.htm', data).then(res => res.data)
	}
	
	// 获取当前用户信息
	getUserInfo() {
		return this._request.getRequest(this._baseUrl + '/wxa/customer/customer-info.htm').then(res => res.data)
	}
	
	// 设置昵称 || 姓名 || 公司名称 || 昵称
	setUserInfo(data) {
		return this._request.postRequest(`${this._baseUrl}/wxa/customer/set-${data.type}.htm`, data.opts).then(res => res.data)
	}
	
	// 更换客服
	changeUser(userId) {
		const data = {
			userId: userId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/change-user.htm', data).then(res => res.data)
	}
	
	// 重新绑定手机号
	setPhone(phone) {
		const data = {
			phone: phone
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/set-phone.htm', data).then(res => res.data)
	}
	
	// 关于我们
	aboutUs() {
		return this._request.postRequest(this._baseUrl + '/wxa/about-us.htm').then(res => res.data)
	}
	
	// 获取openid
	getOpenid(code, name, head) {
		let data = null;
		if(name){
			data = {
				code: code,
				nickName: name,
				avatarUrl: head
			}
		}else{
			data = {
				code: code
			}
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/collect-info.htm', data).then(res => res.data)
	}
	
	// 收集formid
	collectFormId(formIds){
		const data = {
			formIds: formIds
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/collect-form-id.htm', data).then(res => res.data)
	}
	
	// 判断是否开通微信支付
	checkWxpay(){
		return this._request.postRequest(this._baseUrl + '/wxa/check-wxpay.htm').then(res => res.data)
	}
	
	// 发起微信支付
	launchWxpay(reservationId){
		const data = {
			reservationId: reservationId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/order/wxpay-unifiedorder.htm', data).then(res => res.data)
	}
	
	// 优惠券列表
	couponList(page, pageSize){
		const data = {
			page: page,
			pageSize: pageSize
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/coupon-list.htm', data).then(res => res.data)
	}
	
	// 邀请明细
	inviteDetail(status, page, pageSize){
		const data = {
			status: status,
			page: page,
			pageSize: pageSize
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/invitation-list.htm', data).then(res => res.data)
	}
	
	// 获取im登录配置
	getImLoginInfo() {
		return this._request.getRequest(this._baseUrl + '/wxa/im/user-im.htm').then(res => res.data)
	}
	
	// 发送商品详情给客服
	sendGoodsToIm(cardId) {
		const data = {
			cardId: cardId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/im/send-detail.htm', data).then(res => res.data)
	}
	
	// 发送订单详情给客服
	sendOrderToIm(reservationId) {
		const data = {
			reservationId: reservationId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/im/send-order.htm', data).then(res => res.data)
	}
	
	// 获取历史消息
	getImHistory(data) {
		return this._request.postRequest(this._baseUrl + '/wxa/im/msg-history.htm', data).then(res => res.data)
	}
	
	// 判断客户是否在小程序中
	getuserStatus(status) {
		const data = {
			status: status
		}
		return this._request.postRequest(this._baseUrl + '/wxa/customer/change-status.htm', data).then(res => res.data)
	}
	
	// 商品详情浏览时长
	timeOfGoodDetail(data){
		return this._request.postRequest(this._baseUrl + '/wxa/product/time-surfed.htm', data).then(res => res.data)
	}
	
	// 商品卡分享成功记录
	goodShareSuc(cardId){
		const data = {
			cardId: cardId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/product/share-success.htm', data).then(res => res.data)
	}
	
	// 测款
	getisLike(like, cardId){
		const data = {
			like: like,
			cardId: cardId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/product/like.htm', data).then(res => res.data)
	}
	
	// 记录客户分享销售卡片
	recordShareSaler(userId){
		const data = {
			userId: userId
		}
		return this._request.postRequest(this._baseUrl + '/wxa/seller/share-sale-card.htm', data).then(res => res.data)
	}
	
	// 满减活动
	getActivity(){
		return this._request.postRequest(this._baseUrl + '/wxa/cart/activity.htm').then(res => res.data)
	}

}

Object.assign(api.prototype, newApi);
export default api