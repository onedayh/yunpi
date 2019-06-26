import util from "../../utils/util";
const app = getApp();
let salerHead = null, shareImage = null, isFilter = false, pictrue = null, shopHead = null, shopImage = null, myId = null, siteName = '';

Page({
	data: {
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		isLogin: null,

        animationData: {},
        point: false,
		
		showList: [
			{type: 1, name: '实时线索'},
			{type: 2, name: '客户管理'}
		],
		showType: 1,
		scrolltop1: 0,
		scrolltop2: 0,
		clue: {
			page: 1,			// 页码
			customerId: ''			// 客户id
		},
		clueList: [],
		curIndex: null,
		
		
		customer: {
			page: 1,
			customerLevel: '',
			propName: '',
			dir: ''
		},
		customerList: [],
		
		feedback1: '加载中...',
		load1: false,			// 是否加载过数据
		loadMore1: false,
		
		feedback2: '加载中...',
		load2: false,			// 是否加载过数据
		loadMore2: false,
		
		levelName: '客户等级',
		orderMax: false,
		shareMax: false,
		showFilter: false,
		animationFilter: {},
		levelId: 0,　
		levelList: ['客户等级', '黄钻', '白钻', '黑钻'],
		
		loadcus: false,		// 是否加载完成
		spread: false,		// 是否展开
		spreadAnimate: {}
	},

    onLoad() {
		util.showLoading();
		salerHead = null; shareImage = null; isFilter = false; pictrue = null; shopHead = null; shopImage = null; myId = null; siteName = '';
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
		this.setData({
			isLogin: isLogin
		})
		if(isLogin === 'user'){
			util.changeTabBar();
			util.setTitle('销售助手');
			app.api.getuserStatus_B(true);
			// this.getClueList_B();
			this.getInfo();
		}else if(isLogin === 'customer'){
			wx.hideShareMenu();
			this.getSalerData()
		}
    },
	
	onReady(){
		if(!app.data.isReadingMsg && app.data.isLogin === 'user') this.selectComponent('#pushBox').getUnReadMsgCount_B();
	},

    onShow(){
		if(app.data.isLogin === 'user'){
			this.getClueList_B();
			this.getCustomerList();
			if(app.data.msgToIndex){
				this.setData({
					showType: 2
				})
				app.data.msgToIndex = false;
				if(!this.data.load2) this.getCustomerList()
			}
			app.toggleRedHot_B();
		}
		if(app.data.isLogin === 'customer'){
			this.setData({
				point: app.data.hasUnReadMsg
			})
			app.toggleRedHot();
			this.hideShareInfo();
		}
    },
	
    // 客服
    formbutton(e){
		app.collectFormId(e.detail.formId);
        util.navTo(`im/im`)
    },
	
	onPullDownRefresh(){
		if(this.data.isLogin === 'user'){
			this.getClueList_B()
		}else{
			wx.stopPullDownRefresh()
		}
	},
	
	
	/*
	*	商家端
	*/
	// 获取线索列表
	getClueList_B(){
		this.setData({
			feedback: '加载中...',
			'clue.page': 1
		}, () => {
			app.api.getClueList_B({
				...this.data.clue,
				pageSize: app.data.pageSize
			}).then(res => {
				if(res.success){
					const datas = res.data;
					datas.list.forEach(item => {
						let logoUrl = item.logoUrl;
						if(logoUrl){
							if(logoUrl.indexOf('http') === -1){
								logoUrl = app.data.baseUrl + logoUrl
							}
						}else{
							logoUrl = app.data.defaultHead
						}
						item.logoUrl = logoUrl;
					})
					this.setData({
						clueList: datas.list,
						feedback1: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
						loadMore1: datas.lastPage ? false : true,
						load1: true,
						scrollTop1: 0
					})
					util.pageTo(0);
					wx.stopPullDownRefresh();
				}else{
					this.setData({
						feedback1: res.msg
					})
				}
			})
		});
	},
	
	getCustomerList(){
		this.setData({
			'customer.page': 1
		}, () => {
			app.api.getCustomerList_B({
				...this.data.customer,
				pageSize: app.data.pageSize
			}).then(res => {
				if(res.success){
					const datas = res.data;
					datas.list.forEach(item => {
						let logoUrl = item.logoUrl;
						if(logoUrl){
							if(logoUrl.indexOf('http') === -1){
								logoUrl = app.data.baseUrl + logoUrl
							}
						}else{
							logoUrl = app.data.defaultHead
						}
						item.logoUrl = logoUrl;
					})
					this.setData({
						customerList: datas.list,
						feedback2: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
						loadMore2: datas.lastPage ? false : true,
						load2: true
					})
				}else{
					this.setData({
						feedback2: res.msg
					})
				}
				if(isFilter){
					wx.hideLoading();
					isFilter = false
				}
			})
		})
	},
	
	onReachBottom(){
		if(this.data.showType === 1 && this.data.loadMore1){
			this.setData({
				loadMore1: false,
				feedback1: '加载中...'
			})
			const page = this.data.clue.page;
			app.api.getClueList_B({
				...this.data.clue,
				page: page + 1,
				pageSize: app.data.pageSize
			}).then(res => {
				if(res.success){
					const datas = res.data;
					datas.list.forEach(item => {
						let logoUrl = item.logoUrl;
						if(logoUrl){
							if(logoUrl.indexOf('http') === -1){
								logoUrl = app.data.baseUrl + logoUrl
							}
						}else{
							logoUrl = app.data.defaultHead
						}
						item.logoUrl = logoUrl;
					})
					this.setData({
						clueList: this.data.clueList.concat(datas.list),
						feedback1: datas.lastPage ? '已加载全部数据' : '',
						loadMore1: datas.lastPage ? false : true,
						'clue.page': page + 1
					})
				}else{
					this.setData({
						feedback1: res.msg,
						loadMore1: true
					})
				}
			})
		}else if(this.data.showType === 2 && this.data.loadMore2){
			this.setData({
				loadMore2: false,
				feedback3: '加载中...'
			})
			const page = this.data.customer.page;
			app.api.getCustomerList_B({
				...this.data.customer,
				page: page + 1,
				pageSize: app.data.pageSize
			}).then(res => {
				if(res.success){
					const datas = res.data;
					datas.list.forEach(item => {
						let logoUrl = item.logoUrl;
						if(logoUrl){
							if(logoUrl.indexOf('http') === -1){
								logoUrl = app.data.baseUrl + logoUrl
							}
						}else{
							logoUrl = app.data.defaultHead
						}
						item.logoUrl = logoUrl;
					})
					this.setData({
						customerList: this.data.customerList.concat(datas.list),
						feedback2: datas.lastPage ? '已加载全部数据' : '',
						loadMore2: datas.lastPage ? false : true,
						'customer.page': page + 1
					})
				}else{
					this.setData({
						feedback2: res.msg,
						loadMore2: true
					})
				}
			})
		}
	},
	
	onHide(){
		this.hideFilter();
	},
	
	changeType(e){
		const id = Number(e.currentTarget.dataset.id);
		if(id === 1 && this.data.clueList.length === 0){
			this.hideFilter();
			this.getClueList_B();
		}
		if(id === 2 && this.data.customerList.length === 0) this.getCustomerList();
		this.setData({
			showType: id
		})
		wx.pageScrollTo({
			scrollTop: id === 1 ? this.data.scrollTop1 : id === 2 ? this.data.scrollTop2 : '',
			duration: 0
		})
	},
	
	// 跳转客户详情
	goInfo(e){
		app.collectFormId(e.detail.formId);
		util.navTo(`customer/customer?id=${e.currentTarget.dataset.id}`)
	},
	
	// 跳转im
	goIm(e){
		app.collectFormId(e.detail.formId);
		util.navTo(`im/im?toAccount=${e.currentTarget.dataset.id}`);
	},
	
	// 跳转添加笔记
	goNote(e){
		app.collectFormId(e.detail.formId);
		const dataset = e.currentTarget.dataset;
		util.navTo(`addNote/addNote?id=${dataset.id}&name=${dataset.name}`)
	},
	
	// 展示切换
	goDown(e){
		app.collectFormId(e.detail.formId);
		const index = e.target.dataset.index;
		this.setData({
			curIndex: this.data.curIndex === index ? null : index
		})
	},
	
	// 筛选客户
	filterCus(e){
		const id = e.currentTarget.dataset.id;
		let {orderMax, shareMax, customer, levelId} = this.data;
		if(id === 'order'){
			customer = orderMax ? {...customer, page: 1, pageSize: app.data.pageSize, dir: '', propName: ''} : {...customer, page: 1, pageSize: app.data.pageSize, dir: 'DESC', propName: 'res'};
			orderMax = !orderMax;
			shareMax = false;
			this.hideFilter();
		}else if(id === 'share'){
			customer = shareMax ? {...customer, page: 1, pageSize: app.data.pageSize, dir: '', propName: ''} : {...customer, page: 1, pageSize: app.data.pageSize, dir: 'DESC', propName: 'share'};
			shareMax = !shareMax;
			orderMax = false;
			this.hideFilter();
		}else if(id === 'level'){
			const index = e.currentTarget.dataset.index;
			if(index === levelId){
				return
			}else{
				customer = {...customer, page: 1, pageSize: app.data.pageSize, customerLevel: index ? index : ''};
				levelId = index;
				this.hideFilter();
			}
		}
		util.showLoading();
		isFilter = true;
		this.setData({
			customer: customer,
			orderMax: orderMax,
			shareMax: shareMax,
			levelId: levelId
		}, () => {
			this.getCustomerList()
		})
	},
	
	// 显示筛选框
	showFilter(){
		const that = this;
		that.setData({showFilter: true}, () => {
			const animation = wx.createAnimation({
				duration: 300,
				timingFunction: 'ease'
			})
			that.animation = animation;
			animation.top(176 + 'rpx').step();
			that.setData({
				animationFilter: animation.export()
			})
		})
	},
	
	// 隐藏筛选框
	hideFilter(){
		const that = this;
		const animation = wx.createAnimation({
			duration: 0
		})
		that.animation = animation;
		animation.top(-450 + 'rpx').step();
		that.setData({
			animationFilter: animation.export(),
			showFilter: false
		})
	},
	
	// 点击模态层
	hide(e){
		if(e.target.dataset.id === 'mode') this.hideFilter()
	},
	
	getSalerData(){
		app.api.getSalerData().then(res => {
			if(res.success){
				let datas = res.data, customerLogo = [];
				datas.customerLogo.forEach(item => {
					if(item){
						if(item.indexOf('http') === -1){
							item = app.data.baseUrl + item
						}
					}else{
						item = app.data.defaultHead
					}
					customerLogo.push(item)
				})
				app.changeImg(datas.logoPath).then(res1 => {
					salerHead = res1;
					app.changeImg(datas.pictrue).then(res2 => {
						pictrue = res2;
						this.drawSaleCard(datas);
					})
				});
				this.setData({
					salerData: datas,
					otherLen: datas.otherInfraOrganization.length,
					otherHei: datas.otherInfraOrganization.length >= 2 ? 380 : datas.otherInfraOrganization.length * 190,
					customerLogo: customerLogo,
					loadcus: true
				})
				wx.hideLoading();
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	call(e){
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone
		})
	},
	
	copy(e){
		const content = e.currentTarget.dataset.content;
		if(content){
			wx.setClipboardData({
				data: content,
				success: res => {
					if (res.errMsg === 'setClipboardData:ok') {
						util.showToast('已复制', 'success');
					}
				}
			})
		}else{
			util.showToast('复制失败')
		}
	},
	
	goAllGoods(){
		util.tabTo(`allGoods/allGoods`)
	},
	
	// 分享商品卡
	showShareInfo(){
		this.setData({
			showShare: true
		}, () => {
			const animation = wx.createAnimation({
				duration: 300,
				timingFunction: 'ease',
			})
			this.animation = animation;
			animation.bottom(0).step();
			this.setData({
				animationData:animation.export()
			})
		})
	},
	
	hideShareInfo(){
		const animation = wx.createAnimation({
			duration: 300,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.bottom(-200).step();
		this.setData({
			animationData:animation.export()
		}, () => {
			setTimeout(() => {
				this.setData({
					showShare: false
				})
			}, 200)
		})
	},
	
	hideWrap(e){
		if(e.target.dataset.id === 'wrap') this.hideShareInfo()
	},
	
	goCanvas(){
		util.navTo(`canvas/canvas?salerId=${this.data.salerData.userId}&customerId=${this.data.salerData.customerId}`)
	},
	
	onShareAppMessage(){
		console.log(shareImage);
		console.log(shopImage);
		let shareObj = null;
		const {salerData, isLogin} = this.data;
		if(isLogin === 'customer'){
			shareObj = {
				title: salerData.title,
				path: `/pages/salerCard/salerCard?salerId=${salerData.userId}&customerId=${salerData.customerId}`,
				imageUrl: shareImage,
				success: () => {
					this.hideShareInfo();
					app.api.recordShareSaler(salerData.userId);
				}
			}
		}else if(isLogin === 'user'){
			shareObj = {
				title: `你好，为你推荐${siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
				imageUrl: shopImage,
				path: `/pages/shopCard/shopCard?userId=${myId}`,
			}
		}
		return shareObj
	},
	
	getform(e){
		app.collectFormId(e.detail.formId)
	},
	
	// 查看更多门店
	lookMore(){
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.height(this.data.otherLen * 188 + 'rpx').step();
		this.setData({
			spread: true,
			spreadAnimate: animation
		})
	},
	
	// 收起门店
	takeUp(){
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.height(376 + 'rpx').step();
		this.setData({
			spread: false,
			spreadAnimate: animation
		})
	},
	
	drawSaleCard(datas){
		const ctx = wx.createCanvasContext('myCanvas');
		// 背景图
		ctx.drawImage('../../img/saler_c_bg.png', 0, 0, 210, 168);
		// 商家名称
		ctx.setFontSize(12);
		ctx.setFillStyle('#fff');
		ctx.setTextBaseline('middle');
		ctx.fillText(datas.siteName, 35, 21);
		// 门店头像
		util.circleImg(ctx, pictrue, 10, 10, 10);
		// 销售头像
		util.circleImg(ctx, salerHead, 75, 35, 30);
		// 销售名称
		ctx.setTextAlign('center');
		ctx.fillText(`销售：${datas.nickName}`, 105, 110);
		// 销售电话
		ctx.setFontSize(10);
		ctx.setTextAlign('left');
		ctx.drawImage('../../img/phone_a.png', 67, 119, 12, 12);
		ctx.fillText(datas.phoneMobile, 79, 128);
		// 服务
		ctx.fillText(`累计服务客户${datas.customerSize}人`, 10, 150);
		ctx.draw(false, () => {
			wx.hideLoading();
			wx.canvasToTempFilePath({
				canvasId: 'myCanvas',
				destWidth: 840,
				destHeight: 672,
				success: res => {
					shareImage = res.tempFilePath;
				},
				fail: () => {
					util.showToast('保存失败，请重试!')
				}
			})
		})
	},
	
	// 获取销售信息
	getInfo(){
		app.api.getInfo_B().then(res => {
			myId = res.data.infraUserId;
			this.getShopCard();
		})
	},
	
	getShopCard(){
		app.api.getShopCard().then(res => {
			if(res.success){
				let datas = res.data;
				siteName = datas.siteName;
				app.changeImg(datas.picture).then(res1 => {
					shopHead = res1;
					this.drawShopCard(datas)
				});
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	drawShopCard(datas){
		const ctx = wx.createCanvasContext('shopCanvas');
		// 背景图
		ctx.drawImage('../../img/saler_c_bg.png', 0, 0, 210, 168);
		// 商家头像
		util.circleImg(ctx, shopHead, 75, 35, 30);
		// 商家名称
		ctx.setFillStyle('#fff');
		ctx.setTextBaseline('middle');
		ctx.setTextAlign('center');
		ctx.fillText(datas.siteName, 105, 110);
		// 商家电话
		ctx.setFontSize(10);
		ctx.setTextAlign('left');
		ctx.drawImage('../../img/phone_a.png', 67, 119, 12, 12);
		ctx.fillText(datas.sitePhone, 79, 125);
		// 服务
		ctx.setFillStyle('rgba(0, 0, 0, .3)');
		ctx.fillRect(0, 139, 210, 29);
		ctx.setFillStyle('#fff');
		ctx.fillText(`${datas.countCard}个爆款正在热卖`, 10, 152);
		ctx.draw(false, () => {
			wx.hideLoading();
			wx.canvasToTempFilePath({
				canvasId: 'shopCanvas',
				destWidth: 840,
				destHeight: 672,
				success: res => {
					shopImage = res.tempFilePath;
				},
				fail: () => {
					util.showToast('保存失败，请重试!')
				}
			})
		})
	},
})