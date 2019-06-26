// pages/orderDetails/orderDetails.js
import util from '../../utils/util';
const app = getApp();
let wxpay = false;
Page({
	data: {
		orderId: '',
		detail: {},
		timer: null,
		baseUrl: app.data.baseUrl,
		countdown: '00小时00分00秒',
        load: false,
		from: '',
		
		isLogin: null,
	},
	
	choose(id){
		const isLogin = app.data.isLogin;
		let api = '';
		if(isLogin === 'customer'){
			api = app.api.orderDetail(id)
		}else{
			api = app.api.getOrderDetail_B(id)
		}
		return api
	},

	onLoad(e) {
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
		this.setData({
			isLogin: isLogin
		})
		if(isLogin === 'user'){
			util.setTitle('订单');
		}else{
			wxpay = false;
			app.checkWxpay().then(res => {
				wxpay = res;
			}).catch(err => {
				util.showToast(err)
			})
		}
        util.showLoading();
        this.choose(e.id).then(res => {
			if (res.success) {
				res.data.snapShot.forEach(item => {
					item.color = item.sku.split(";")[0];
					item.size = item.sku.split(";")[1]
				})
				if (res.data.orderStatus == 1) { //待付款订单追加倒计时
					let timer = setInterval(() => {
						let t = parseInt(new Date(res.data.createTime.replace(/-/g, '/')).getTime() / 1000) + 48 * 60 * 60 - parseInt(new Date().getTime() / 1000);
						if (t <= 0) { //付款时间已过，扭转状态变成已作废
							clearInterval(timer);
							let detail = this.data.detail;
							detail.orderStatus = 6;
							detail.orderStatusText = "已作废";
							this.setData({
								detail: detail
							})
						} else {
							let hours = this.toDou(parseInt(t / 3600));
							let mins = this.toDou(parseInt((t % 3600) / 60));
							let seconds = this.toDou(parseInt(t % 60));
							let countdown = `${hours}小时${mins}分${seconds}秒`;
							this.setData({
								countdown: countdown
							})
						}
					}, 1000)
				}
				this.setData({
                    load: true,
					detail: res.data,
					orderId: e.id,
					from: e.from ? e.from : ''
				})
                wx.hideLoading()
			} else {
				util.showToast(res.msg)
			}
		})
	},

	toDou(n) {
		if (n < 10) {
			return '0' + n
		} else {
			return n
		}
	},
	
	onReady(){
		if(!app.data.isReadingMsg && app.data.isLogin === 'customer') this.selectComponent('#pushBox').getUnReadMsgCount();
	},
	checkLogistics(e) {
		const detail = this.data.detail;
		if (detail.delivery.waybillNumber) {//有物流单号
			wx.setClipboardData({
				data: e.currentTarget.dataset.code,
				success: res => {
					// if (res.errMsg === 'setClipboardData:ok') {
						wx.showToast({
							title: `${detail.delivery.deliveryCompany}快递单号已复制，请到快递100查看`,
							icon: 'none'
						})
					// }
				}
			})
		} else {
			wx.showToast({
				title: '商家线下发货，无需物流信息',
				icon: 'none'
			})
		}
	},
	cancelOrder() {
		wx.showModal({
			title: '温馨提示',
			content: '是否取消此订单?',
			success: data => {
				if (data.confirm) {
					wx.showLoading({
						title: '加载中',
					})
					app.api.cancelOrder(this.data.orderId).then(res => {
						if (res.success) {
							wx.showToast({
								title: '取消成功',
								success: res => {
									wx.setStorageSync('cancelId', this.data.orderId)
									wx.navigateBack({
										url: "/pages/orderList/orderList"
									})
								}
							})
						} else {
							util.showToast(res.msg)
						}
					})
				}
			}
		})
	},
	delOrder() {
		wx.showModal({
			title: '温馨提示',
			content: '是否删除此订单?',
			success: data => {
				if (data.confirm) {
					util.showLoading();
					app.api.delOrder(this.data.orderId).then(res => {
						if (res.success) {
							wx.showToast({
								title: '订单删除成功',
								success: res => {
									wx.setStorageSync('deleteId', this.data.orderId)
									wx.navigateBack({
										url: "/pages/orderList/orderList"
									})
								}
							})
						}else{
                            util.showToast(res.msg)
                        }
					})
				}
			}
		})
	},
	payOrder(e) {
		util.showLoading();
		const {dataset} = e.currentTarget, {orderId} = this.data;
		if(wxpay){
			// 微信支付
			app.api.launchWxpay(orderId).then(res1 => {
				if(res1.success){
					wx.requestPayment({
						...res1.data,
						success: () => {
							util.showToast('支付成功', 'success');
							wx.setStorageSync('payId', orderId);
							let detail = this.data.detail;
							detail.orderStatus = 3;
							detail.realityPrice = detail.shouldPay;
							detail.orderStatusText = "待发货";
							this.setData({
								detail: detail
							})
						},
						fail: () => {
							util.showToast('支付失败');
						}
					})
				}else{
					util.showToast(res1.msg)
				}
			})
		}else{
			wx.hideLoading();
			util.navTo(`choosePayment/choosePayment?id=${orderId}&number=${dataset.number}&money=${dataset.money}`)
		}
	},

	copyOrderCode(e) {
		wx.getClipboardData({
			success: data => {
				if (data.data === e.currentTarget.dataset.code) {
					wx.showToast({ //复制成功以后不再调起复制
						title: '已复制过',
						icon: 'none'
					})
				} else {
					wx.setClipboardData({
						data: e.currentTarget.dataset.code,
						success: res => {
							if (res.errMsg === 'setClipboardData:ok') {
								wx.showToast({ //覆盖默认的“内容复制成功”
									title: '复制成功'
								})
							}
						}
					})
				}
			}
		})
	},

	onShow() {
		//如果存在payId说明该订单已扭转状态
		if(!wxpay){
			const payId = wx.getStorageSync('payId');
			if (payId) {
				let detail = this.data.detail;
				detail.orderStatus = 2;
				detail.orderStatusText = "待核实";
				this.setData({
					detail: detail
				})
			}
		}
	},

    formbutton(e){
		app.collectFormId(e.detail.formId);
		if(this.data.from === 'im'){
			util.navBack(1);
		}else{
			util.showLoading();
			app.api.sendOrderToIm(this.data.orderId).then(res => {
				if (res.success) {
					util.navTo(`im/im`)
				} else {
					util.showToast(res.msg)
				}
			})
		}
    },
	
	// 发消息
	goIm(e){
		app.collectFormId(e.detail.formId);
		if(this.data.from === 'im'){
			util.navBack(1)
		}else{
			util.navTo(`im/im?toAccount=${e.detail.target.dataset.id}`)
		}
	},
	
	goInfo(e){
		if(this.options.fromInfo) {
			util.navBack(1)
		}else{
			util.navTo(`customer/customer?id=${e.currentTarget.dataset.id}`)
		}
	},
	
	goIndex(e){
		app.collectFormId(e.detail.formId);
		util.tabTo(`index/index`);
	},
})