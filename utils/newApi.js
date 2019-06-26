import request from './request.js';

const newApi = {
	/*
	**********************  	商家端    **********************
	*/
	// 登录
	login_B(code){
		const data = {
			wxacode: code
		}
		return this._request.postRequest(this._baseUrl + '/wxab/loginwxa.htm', data).then(res => res.data)
	},
	
	// 设置销售个人信息
	setOwenName_B(name){
		const data = {
			name: name
		}
		return this._request.postRequest(this._baseUrl + '/wxab/set-name.htm', data).then(res => res.data)
	},
	
	// 线索列表
	getClueList_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/sale/clue-list.htm', data).then(res => res.data)
	},
	
	// 客户列表
	getCustomerList_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/sale/customer-list.htm', data).then(res => res.data)
	},
	
	// 销售个人信息
	getInfo_B(){
		return this._request.getRequest(this._baseUrl + '/wxab/info.htm').then(res => res.data)
	},
	
	// 销售订单列表
	getOrderList_B(orderStatus, page){
		return this._request.getRequest(`${this._baseUrl}/wxab/order-list.htm?orderStatus=${orderStatus}&page=${page}&pageSize=5`).then(res => res.data)
	},
	
	// 销售订单详情
	getOrderDetail_B(reservationId) {
		return this._request.getRequest(`${this._baseUrl}/wxab/sale/detail.htm?reservationId=${reservationId}`).then(res => res.data)
	},
	
	// 添加销售笔记
	addNote_B(customerId, content){
		const data = {
			customerId: customerId,
			content: content
		}
		return this._request.postRequest(this._baseUrl + '/wxab/sale/add-note.htm', data).then(res => res.data)
	},
	
	// 收集formid
	collectFormId_B(formIds){
		const data = {
			formIds: formIds
		}
		return this._request.postRequest(this._baseUrl + '/wxab/collect-form-id.htm', data).then(res => res.data)
	},
	
	// 获取客户资料
	getCustomerInfo_B(customerId){
		const data = {
			customerId: customerId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/sale/customer-info.htm', data).then(res => res.data)
	},
	
	// 修改客户资料
    modifyInfo_B(data){
        return this._request.postRequest(this._baseUrl + '/wxab/sale/edit-customer.htm', data).then(res => res.data)
    },

    // 获取客户分类信息
    getBaseList_B(){
        return this._request.postRequest(this._baseUrl + '/wxab/sale/find-base-msg.htm').then(res => res.data)
    },
	
	// 获取客户订单信息
	getOrder_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/sale/order-list.htm', data).then(res => res.data)
	},
	
	// 获取客户订单数量
	getOrderCount_B(customerId){
		const data = {
			customerId: customerId
		}
		return this._request.getRequest(this._baseUrl + '/wxab/sale/order-count.htm', data).then(res => res.data)
	},
	
	// 核心行为分析
	centerAnalyze_B(customerId, day){
		const data = {
			customerId: customerId,
			day: day
		}
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/behaviour.htm', data).then(res => res.data)
	},
	
	// 活跃度分析
	vitalityAnalyze_B(customerId){
		const data = {
			customerId: customerId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/vitality.htm', data).then(res => res.data)
	},
	
	// 购买行为分析
	buyingAnalyze_B(customerId, day){
		const data = {
			customerId: customerId,
			day: day
		}
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/buying.htm', data).then(res => res.data)
	},
	
	// 商品卡列表
	getCardList_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/product/card-list.htm', data).then(res => res.data)
	},
	
	// 商品库列表
	getShopList_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/product/online-list.htm', data).then(res => res.data)
	},
	
	// 商品库商品详情
	goodDetail_B(commodityId){
		const data = {
			commodityId: commodityId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/detail.htm', data).then(res => res.data)
	},

	// 商品卡商品详情
	cardDetail_B(cardId){
		const data = {
			cardId: cardId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/card-detail.htm', data).then(res => res.data)
	},
	
	// 设置商品为商品卡
	setCard_B(commodityId){
		const data = {
			commodityId: commodityId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/set-card.htm', data).then(res => res.data)
	},
	
	// 商品卡上架下架
	setCardStatus_B(cardId, putaway){
		const data = {
			cardId: cardId,
			putaway: putaway
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/putaway.htm', data).then(res => res.data)
	},
	
	// 商品卡数据
	getCardData_B(cardId, day){
		const data = {
			cardId: cardId,
			day: day
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/card-data.htm', data).then(res => res.data)
	},
	
	// 商品卡分享记录
	shareCard_B(cardId, reason){
		const data = {
			cardId: cardId,
			reason: reason
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/share-success.htm', data).then(res => res.data)
	},
	
	// 商品卡购物车、收藏、销售、转发数据
	getCardDetailData_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/product-card-detail.htm', data).then(res => res.data)
	},
	
	// 获取openid
	getOpenid_B(code) {
		const data = {
			code: code
		}
		return this._request.postRequest(this._baseUrl + '/wxab/bind-openid.htm', data).then(res => res.data)
	},
	
	// 获取im登录配置
	getImLoginInfo_B(toAccount) {
		const data = {
			toAccount: toAccount
		}
		return this._request.getRequest(this._baseUrl + '/wxab/im/user-im.htm', data).then(res => res.data)
	},
	
	// 商品卡分享成功记录
	goodShareSuc_B(cardId){
		const data = {
			cardId: cardId
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/share-success.htm', data).then(res => res.data)
	},
	
	// im聊天列表
	getChatList_B(keyword){
		const data = {
			keyword: keyword
		}
		return this._request.postRequest(this._baseUrl + '/wxab/im/chat-list.htm', data).then(res => res.data)
	},
	
	// 判断商家是否在小程序中
	getuserStatus_B(status) {
		const data = {
			status: status
		}
		return this._request.postRequest(this._baseUrl + '/wxab/change-status.htm', data).then(res => res.data)
	},
	
	// 发送商品卡给客户
	sendGoods_B(cardId, toAccount){
		const data = {
			cardId: cardId,
			toAccount: toAccount
		}
		return this._request.postRequest(this._baseUrl + '/wxab/im/send-card.htm', data).then(res => res.data)
	},
	
	// 批量设置商品卡
	batchSetCard_B(commodityIds){
		const data = {
			commodityIds: commodityIds,
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/batch-set-cards.htm', data).then(res => res.data)
	},
	
	// 批量上架/下架商品卡
	batchPutaway_B(cardIds, putaway){
		const data = {
			cardIds: cardIds,
			putaway: putaway
		}
		return this._request.postRequest(this._baseUrl + '/wxab/product/batch-putaway.htm', data).then(res => res.data)
	},
	
	// 商家权限
	saleAuthor_B(){
		return this._request.getRequest(this._baseUrl + '/wxab/role.htm').then(res => res.data)
	},
	
	// 获取商品配置
	getAllOptions_B(){
		return this._request.getRequest(this._baseUrl + '/wxab/product/param-list.htm').then(res => res.data)
	},
	
	// 发布商品
	publish_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/product/product.htm', data).then(res => res.data)
	},
	
	// 销售数据
	saleData_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/sales-statistics.htm', data).then(res => res.data)
	},
	
	// 客户数据
	userData_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/customer-statistics.htm', data).then(res => res.data)
	},
	
	//商品数据
	goodsData_B(data){
		return this._request.postRequest(this._baseUrl + '/wxab/analyze/commodity-statistics.htm', data).then(res => res.data)
	},
}
export default newApi