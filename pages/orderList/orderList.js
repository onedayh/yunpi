import util from '../../utils/util';
const app = getApp();
let wxpay = false;
Page({
	data: {
		baseUrl: app.data.baseUrl,
		winHeight: "",//窗口高度
		currentTab: 0, //预设当前项的值
		scrollLeft: 0, //tab标题的滚动条位置
		activeIndex: 0,
		flag: true,//允许加载
		loadMore: false,//加载更多
		loadingComplete: false,//全部加载完成
		isLogin: null,
		tab: [
			{
				currentTab: 0,
				name: '全部',
				orderStatus: '',
				page: 1,
				lastPage: false,
				isLoad: false//纪录是否曾经调用接口
			},
			{
				currentTab: 1,
				name: '待付款',
				orderStatus: 1,
				page: 1,
				lastPage: false,
				isLoad: false
			},
			{
				currentTab: 2,
				orderStatus: 2,
				name: '待核实',
				page: 1,
				lastPage: false,
				isLoad: false
			},
			{
				currentTab: 3,
				orderStatus: 3,
				name: '待发货',
				page: 1,
				lastPage: false,
				isLoad: false
			},
			{
				currentTab: 4,
				orderStatus: 5,
				name: '已发货',
				page: 1,
				lastPage: false,
				isLoad: false
			},
			{
				currentTab: 5,
				orderStatus: 6,
				name: '已作废',
				page: 1,
				lastPage: false,
				isLoad: false
			},
			{
				currentTab: 6,
				orderStatus: 7,
				name: '已完成',
				page: 1,
				lastPage: false,
				isLoad: false
			}
		]
	},
	deleteOrder(e) {
		app.api.collectFormId();
		wx.showModal({
			title: '温馨提示',
			content: '是否删除此订单?',
			success: data => {
				if (data.confirm) {
					const id = e.currentTarget.dataset.id;
					app.api.delOrder(id).then(res => {
						if (res.success) {
							wx.showToast({
								title: '订单删除成功',
								success: r => {
									//删除订单以后要对应删除全部和作废订单里面的对应订单
									this.delData(id)
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
	delData(id) {
		const tab = this.data.tab
		if (tab[0].list) {
			tab[0].list.forEach((item, index) => {
				if (item.reservationId == id) {
					tab[0].list.splice(index, 1)//删除旧元素
				}
			})
		}
		//删除待付款中对应的项
		if (tab[5].list) {//待付款中存在list，即已经调用接口
			tab[5].list.forEach((item, index) => {
				if (item.reservationId == id) {
					tab[5].list.splice(index, 1)//删除旧元素
				}
			})
		}
		this.setData({
			tab: tab
		})
	},
	checkLogistics(e) {
		app.api.collectFormId();
		const dataset = e.currentTarget.dataset;
		if (dataset.code) {//有物流单号
			wx.setClipboardData({
				data: e.currentTarget.dataset.code,
				success: res => {
					if (res.errMsg === 'setClipboardData:ok') {
						wx.showToast({
							title: `${dataset.name}单号已复制，请到快递100查看`,
							icon: 'none'
						})
					}
				}
			})
		} else {
			wx.showToast({
				title: '商家线下发货，无需物流信息',
				icon: 'none'
			})
		}
	},
	cancelOrder(e) {
		app.api.collectFormId();
		const cancelId = e.currentTarget.dataset.id;
		wx.showModal({
			title: '温馨提示',
			content: '是否取消此订单?',
			success: data => {
				if (data.confirm) {
					wx.showLoading({
						title: '加载中',
					})
					app.api.cancelOrder(cancelId).then(res => {
						if (res.success) {
							//删除订单成功,扭转状态
							this.changeList(cancelId, 6, '已作废', 1, 5)
							wx.showToast({
								title: '取消成功'
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
		app.api.collectFormId();
		const {dataset} = e.currentTarget;
		if(wxpay){
			// 微信支付
			app.api.launchWxpay(dataset.id).then(res1 => {
				if(res1.success){
					wx.requestPayment({
						...res1.data,
						success: () => {
							util.showToast('支付成功', 'success');
							this.changeList(dataset.id, 3, '待发货', 1, 3);
							setTimeout(() => {
								if (this.data.currentTab && this.data.currentTab > 0) {//如果是全部直接跳过，如果是待付款，跳到待核实
									this.setData({
										currentTab: 3
									})
								}
							}, 1000)
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
			util.navTo(`choosePayment/choosePayment?id=${dataset.id}&number=${dataset.number}&money=${dataset.money}`)
		}
	},

	// 滚动切换标签样式
	switchTab: function (e) {
		let tab = this.data.tab;
		this.setData({
			activeIndex: e.detail.current
		});
		if (!tab[e.detail.current].lastPage) {//如果不是最后一页，则可继续loadMore
			this.setData({
				loadMore: true,
				loadingComplete: false
			})
		} else {
			this.setData({
				loadMore: false,
				loadingComplete: true
			})
		}
		this.checkCor();
		if (!this.data.tab[e.detail.current].isLoad) {//加载第一页数据
			this.getOrderList(this.data.tab[e.detail.current].orderStatus, 1)
		}

	},

	// 点击标题切换当前页时改变样式
	swichNav(e) {
		this.setData({
			loadMore: true,
			loadingComplete: false
		})
		if (e.target.dataset.current == this.data.activeIndex) {
			return false;
		}
		this.setData({
			currentTab: e.target.dataset.current
		})
	},

	//判断当前滚动超过一屏时，设置tab标题滚动条。
	checkCor() {
		if (this.data.activeIndex > 4) {
			this.setData({
				scrollLeft: 300
			})
		} else {
			this.setData({
				scrollLeft: 0
			})
		}
	},

	goToDetail(e) {
		util.navTo(`orderDetails/orderDetails?id=${e.currentTarget.dataset.id}`)
	},

    formSubmit(e) {
		const isLogin = app.data.isLogin;
		if(isLogin === 'customer'){
			util.showLoading();
			app.api.sendOrderToIm(e.currentTarget.dataset.id).then(res => {
				if (res.success) {
					app.collectFormId(e.detail.formId);
					util.navTo(`im/im`)
				} else {
					util.showToast(res.msg)
				}
			})
		}else if(isLogin === 'user'){
			app.collectFormId(e.detail.formId);
			util.navTo(`im/im?toAccount=${e.currentTarget.dataset.id}`)
		}
	},

	toDou(n) {
		if (n < 10) {
			return '0' + n
		} else {
			return n
		}
	},

	countDown(activeIndex) {
		let tab = this.data.tab
		tab[activeIndex].list.forEach(item => {
			if (item.orderStatus == 1) {//待付款订单
				let timer = setInterval(() => {
					//item.createTime = "2018-08-31 15:15:00"
					let t = parseInt(new Date(item.createTime.replace(/-/g, '/')).getTime() / 1000) + 48 * 60 * 60 - parseInt(new Date().getTime() / 1000)
					if (t <= 0) {//付款时间已过，扭转状态变成已作废
						clearInterval(timer);
						this.changeList(item.reservationId, 6, '已作废', 1, 5)
					} else {
						let hours = this.toDou(parseInt(t / 3600));
						let mins = this.toDou(parseInt((t % 3600) / 60));
						let seconds = this.toDou(parseInt(t % 60));
						item.countdown = `剩${hours}小时${mins}分${seconds}秒`;
						this.setData({//每秒更新tab
							tab: tab
						})
					}
				}, 1000)
			} else {
				this.setData({//每秒更新tab
					tab: tab
				})
			}
		})
	},
	
	choose(orderStatus, page){
		let api = null;
		const isLogin = app.data.isLogin;
		if(isLogin === 'user'){
			api = app.api.getOrderList_B(orderStatus, page)
		}else if(isLogin === 'customer'){
			api = app.api.orderList(orderStatus, page)
		}
		return api
	},

	getOrderList(orderStatus, page) {
		let tab = this.data.tab;
		const activeIndex = this.data.activeIndex;
		wx.showLoading({
			title: '加载中',
		})
		this.setData({
			loadMore: true,
			loadingComplete: false
		})
		this.choose(orderStatus, page).then(res => {
		// app.api.orderList(orderStatus, page).then(res => {
			wx.hideLoading();
			if (res.success) {
				res.data.list.forEach(item => {
					item.snapShot.forEach(val => {
						val.color = val.sku.split(";")[0];
						val.size = val.sku.split(";")[1]
					})
				})
				//存在一个问题，数据量大于30页面卡顿
				tab[activeIndex].list = res.data.list;
				tab[activeIndex].isLoad = true;
				tab[activeIndex].lastPage = res.data.lastPage;
				if (res.data.lastPage) {//最后一页
					if (activeIndex == 0 || activeIndex == 1) {
						setTimeout(() => {//配合定时器的1秒延迟
							this.setData({
								loadMore: false,
								loadingComplete: true
							})
						}, 1000)
					} else {
						this.setData({
							loadMore: false,
							loadingComplete: true
						})
					}
				} else {
					if (activeIndex == 0 || activeIndex == 1) {
						setTimeout(() => {//配合定时器的1秒延迟
							this.setData({
								loadMore: true,
								loadingComplete: false
							})
						}, 1000)
					} else {
						this.setData({
							loadMore: true,
							loadingComplete: false
						})
					}
				}
				if (activeIndex == 0 || activeIndex == 1) {//判断待付款订单
					//判断列表中是否有待付款订单
					this.countDown(activeIndex)
				} else {
					this.setData({
						tab: tab
					})
				}
			} else {
                util.showToast(res.msg)
			}
		})
	},
	/*
	  id:操作订单id
	  orderStatus:扭转后的订单状态
	  orderStatusText:扭转后的订单文案
	  prevIndex:需要扭转状态的tab下标
	  nextIndex:扭转后的tab下标
	  eg:待付款订单付款以后进入待核实状态(订单状态从1扭转成2)
	  changeList(id,2,"待核实",1,2)
	 */
	changeList(id, orderStatus, orderStatusText, prevIndex, nextIndex) {
		let tab = this.data.tab;
		//在不在全部中操作都要修改全部的值
		if (tab[0].list) {
			tab[0].list.forEach((item, index) => {
				if (item.reservationId == id) {
					item.orderStatus = orderStatus;
					item.orderStatusText = orderStatusText;
					tab[0].list.unshift(item);//插入元素
					tab[0].list.splice(index + 1, 1)//删除旧元素
				}
			})
		}

		//删除待付款中对应的项
		if (tab[prevIndex].list) {//待付款中存在list，即已经调用接口
			tab[prevIndex].list.forEach((item, index) => {
				if (item.reservationId == id) {
					tab[prevIndex].list.splice(index, 1)//删除旧元素
				}
			})
		}
		if (tab[nextIndex].list && tab[0].list && tab[0].list.length > 0) {//待付款中存在list，即已经调用接口
			tab[nextIndex].list.unshift(tab[0].list[0])
		}
		this.setData({
			tab: tab
		})
	},

	onShow() {
		if (wx.getStorageSync('payId')) {//如果存在payId，则已经确认付款,更新tab
			const payId = wx.getStorageSync('payId');
			if(wxpay){
				this.changeList(payId, 3, '待发货', 1, 3);
			}else{
				this.changeList(payId, 2, '待核实', 1, 2);
			}
			wx.removeStorageSync('payId')
		}
		if (wx.getStorageSync('cancelId')) {//如果存在cancelId，则已经取消订单,更新tab
			const cancelId = wx.getStorageSync('cancelId');
			this.changeList(cancelId, 6, '已作废', 1, 5);
			wx.removeStorageSync('cancelId')
		}
		if (wx.getStorageSync('deleteId')) {
			const deleteId = wx.getStorageSync('deleteId');
			this.delData(deleteId);
			wx.removeStorageSync('deleteId')
		}
	},

	onLoad(e) {
		//个人中心入参
		let currentTab = 0;
		if (e && e.currentTab) {
			currentTab = e.currentTab
		}
		const isLogin = app.data.isLogin;
		this.setData({
			isLogin: isLogin
		});
		if(isLogin === 'user'){
			util.setTitle('订单')
		}else{
			wxpay = false;
			app.checkWxpay().then(res => {
				wxpay = res;
			}).catch(err => {
				util.showToast(err)
			})
		}
		//  高度自适应
		wx.getSystemInfo({
			success: res => {
				var clientHeight = res.windowHeight,
					clientWidth = res.windowWidth,
					rpxR = 750 / clientWidth;
				var calc = clientHeight * rpxR - 90;
				this.setData({
					winHeight: calc,
					currentTab: currentTab
				});
			}
		})
		if (currentTab == 0) {//默认tab下标为0，如果进入页面访问的是全部，为了防止tab因为默认下标不变化而不触发tab
			this.setData({
				loadMore: true,
				loadingComplete: false
			})
			this.getOrderList(this.data.tab[currentTab].orderStatus, 1)
		}
	},

	getMore() {
		if (this.data.flag) {//防止触底多次触发加载更多
			this.setData({
				flag: false
			})
			let tab = this.data.tab
			let activeIndex = this.data.activeIndex
			let orderStatus = tab[activeIndex].orderStatus
			if (!tab[activeIndex].lastPage && !this.data.loadingComplete) {
				let page = ++tab[activeIndex].page
				wx.showLoading({
					title: '加载中',
				})
				this.setData({
					loadMore: true,
					loadingComplete: false,
					flag: true
				})
				this.choose(orderStatus, page).then(res => {
				// app.api.orderList(orderStatus, page).then(res => {
					wx.hideLoading()
					if (res.success) {
						res.data.list.forEach(item => {
							item.snapShot.forEach(val => {
								val.color = val.sku.split(";")[0]
								val.size = val.sku.split(";")[1]
							})
						})
						tab[activeIndex].list = tab[activeIndex].list.concat(res.data.list)
						tab[activeIndex].isLoad = true
						tab[activeIndex].lastPage = res.data.lastPage
						if (activeIndex == 0 || activeIndex == 1) {
							this.countDown(activeIndex)
						} else {
							this.setData({
								tab: tab,
							})
						}

					} else {
                        util.showToast(res.msg)
					}
				})
			} else {
				tab[activeIndex].lastPage = true
				if (activeIndex == 0 || activeIndex == 1) {
					this.countDown(activeIndex)
				} else {
					this.setData({
						tab: tab
					})
				}
				this.setData({
					loadMore: false,
					loadingComplete: true,
					flag: true
				})
			}
		}
	}
})