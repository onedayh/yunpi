const app = getApp();
import util from '../../utils/util';
let n = 0, info = null;
let salerHead = null, shareImage = null, shopHead = null, shopImage = null, siteName = '';

Page({
    data: {
        iconList: [
            {icon: 'pending_pay', icon_b: 'pending_pay_b', name: '待付款', tab: '1', tips: 0},
            {icon: 'pending_verified', icon_b: 'pending_verified_b', name: '待核实', tab: '2', tips: 0},
            {icon: 'pending_delivery', icon_b: 'pending_delivery_b', name: '待发货', tab: '3', tips: 0},
            {icon: 'delivery', icon_b: 'delivery_b', name: '已发货', tab: '4', tips: 0},
            {icon: 'complete', icon_b: 'complete_b', name: '已完成', tab: '6', tips: 0}
        ],
        navList: [
            [
                {path: 'collection', icon: 'Collection', name: '我的收藏', show: 'customer'},
                {path: 'browseHistory', icon: 'watchhistory', name: '浏览历史', show: 'customer'},
                {path: 'addressMeneger', icon: 'adress', name: '地址管理', show: 'customer'},
                {path: 'coupon', icon: 'coupon', name: '优惠券', show: ''},
                {path: 'share', icon: '', name: '分享店铺', show: 'user'},
                {path: 'saleData', icon: '', name: '经营数据', show: ''},
                {path: 'publish', icon: '', name: '发布商品', show: ''}
            ],
            [
                {path: 'im', icon: 'costemer', name: '联系客服', show: 'customer'},
                {path: 'aboutus', icon: 'shop', name: '店铺介绍', show: 'customer'},
                {path: 'invite', icon: 'reward', name: '推荐有奖', show: ''},
            ]
        ],
        name: '',
		customerCount: 0,
        head: null,
        point: false,
	
		showShare: false,
		animationData: {}
    },

    onLoad(){
		util.showLoading();
		salerHead = null; shareImage = null; shopHead = null; shopImage = null; siteName = '';
		const isLogin = app.data.isLogin;
        this.setData({
			isLogin: isLogin
		})
		if(isLogin === 'user'){
			util.changeTabBar();
			wx.hideShareMenu();
		}
    },

    onShow(){
		const isLogin = app.data.isLogin;
		if(isLogin === 'customer'){
			if(app.data.waitPayOrder){
				app.data.waitPayOrder = false;
				util.navTo(`orderList/orderList?currentTab=1`)
			}
			if(app.data.waitSendOrder){
				app.data.waitSendOrder = false;
				util.navTo(`orderList/orderList?currentTab=3`)
			}
			this.getUserInfo();
			this.setData({
				point: app.data.hasUnReadMsg
			})
			app.toggleRedHot()
		}else if(isLogin === 'user'){
			this.getInfo();
			app.toggleRedHot_B();
			this.hideShareInfo();
		}
    },
	
	// 获取销售信息
	getInfo(){
 		app.api.getInfo_B().then(res => {
 			if(res.success){
				info = res.data;
				let {iconList} = this.data;
				iconList[0].tips =  info.waitPay;
				iconList[1].tips =  info.verifyPay;
				iconList[2].tips =  info.waitShipment;
				iconList[3].tips =  info.shipment;
				iconList[4].tips =  info.complete;
				this.setData({
					name: info.nickName,
					customerCount: info.customerRow,
					head: info.logoPath ? info.logoPath.indexOf('http') > -1 ? info.logoPath : app.data.baseUrl + info.logoPath : app.data.defaultHead,
					iconList: iconList
				})
				if(!n){
					this.getShopCard();
					setTimeout(() => {
						this.getUserCard();
					}, 1000)
				}
				n ++
			}else{
				util.showToast(res.msg)
			}
		})
		app.api.saleAuthor_B().then(res => {
			const {navList} = this.data, {data} = res;
			if(data.length > 0){
				data.forEach(item => {
					if(item.permissionId === 122) navList[0][5].show = 'user';
					if(item.permissionId === 123) navList[0][6].show = 'user';
				})
				this.setData({
					navList: navList
				})
			}
		})
	},
	
	getUserCard(){
    	app.api.getSalerData(info.infraUserId).then(res => {
    		if(res.success){
    			const datas = res.data;
				app.changeImg(datas.logoPath).then(res1 => {
					salerHead = res1;
					this.drawSaleCard(datas);
				});
			}else{
    			util.showToast(res.msg)
			}
		})
	},
	
	// 获取客户信息
    getUserInfo(){
        app.api.getUserInfo().then(res => {
            if(res.success){
                info = res.data[0];
                let {iconList, navList} = this.data, count = info.count;
                iconList[0].tips =  count.waitPay;
                iconList[1].tips =  count.verifyPay;
                iconList[2].tips =  count.waitShipment;
                iconList[3].tips =  count.shipment;
                iconList[4].tips =  count.finish;
				const {recommendPrize} = info;
				navList[0][3].show = recommendPrize ? 'customer' : '';
				navList[1][2].show = recommendPrize ? 'customer' : '';
				if(!n) this.getShopCard();
                this.setData({
                    name: info.name,
                    head: info.logoUrl ? info.logoUrl.indexOf('https') > -1 ? info.logoUrl : app.data.baseUrl + info.logoUrl : app.data.defaultHead,
                    iconList: iconList,
					navList: navList
                })
				app.data.reward = info.reward;
				app.data.prizePrice = info.prizePrice;
				app.data.customerId = info.customerId;
				n ++
            }else{
                util.showToast(res.msg)
            }
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

    // 编辑信息
    editInfo(){
        util.navTo(`setup/setup?info=${JSON.stringify(info)}`)
    },

    // 查看订单
    goOrder(e){
        util.navTo(`orderList/orderList?currentTab=${e.currentTarget.dataset.tab}`)
    },

    // 查看其它页
    goNext(e){
        const path = e.currentTarget.dataset.path;
        if(path !== 'publish'){
			util.navTo(`${path}/${path}`)
		}else{
			wx.chooseImage({
				count: 9,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: res => {
					util.navTo(`${path}/${path}?img=${JSON.stringify(res.tempFilePaths)}`)
				},
				fail: err => {
					util.showToast(err)
				}
			})
		}
    },

    formbutton(e){
		app.collectFormId(e.detail.formId);
        util.navTo(`im/im`)
    },
	
	onShareAppMessage(opts){
		let shareOpts = null;
    	if(opts.from === 'button'){
			const target = opts.target.id;
			if(target === 'shareSaler'){
				shareOpts = {
					title: info.title,
					path: `/pages/salerCard/salerCard?salerId=${info.infraUserId}&userId=${info.infraUserId}`,
					imageUrl: shareImage,
					success: () => {
						this.hideShareInfo();
					}
				}
			}else if(target === 'shareShop'){
				shareOpts = {
					title: `你好，为你推荐${siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
					imageUrl: shopImage,
					path: `/pages/shopCard/shopCard?userId=${info.infraUserId}`,
				}
			}
		}else if(opts.from === 'menu'){
			shareOpts = {
				title: `你好，为你推荐${siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
				imageUrl: shopImage,
				path: `/pages/shopCard/shopCard?customerId=${info.customerId}`,
			}
		}
		console.log(shareImage);
		console.log(shopImage);
		return shareOpts
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
		util.navTo(`canvas/canvas?salerId=${info.infraUserId}&userId=${info.infraUserId}`)
	},
	
	drawSaleCard(datas){
		const ctx = wx.createCanvasContext('myCanvas');
		// 背景图
		ctx.drawImage('../../img/saler_c_bg.png', 0, 0, 210, 168);
		// 商家名称
		ctx.setFontSize(12);
		ctx.setFillStyle('#fff');
		ctx.setTextBaseline('middle');
		ctx.fillText(datas.organizationName, 10, 22);
		// 销售头像
		util.circleImg(ctx, salerHead, 75, 35, 30);
		// 销售名称
		ctx.setTextAlign('center');
		ctx.fillText(datas.nickName, 105, 110);
		// 销售电话
		ctx.setFontSize(10);
		ctx.setTextAlign('left');
		ctx.drawImage('../../img/phone_a.png', 67, 119, 12, 12);
		ctx.fillText(datas.phoneMobile, 79, 125);
		// 服务
		ctx.fillText(`累计服务客户${datas.customerSize}人`, 10, 150);
		
			wx.hideLoading();
			ctx.draw(false, () => {
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
		// }, 1000)
		
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
	
	logout(){
    	util.showModal('提示', '确定退出吗？', res => {
    		if(res.confirm){
    			util.showLoading('退出中...');
				app.api.loginOut().then(res => {
    				if(res.success){
						wx.removeStorageSync('isLogin');
						util.relTo('grantAuthor/grantAuthor');
					}else{
    					util.showToast(res.msg)
					}
				})
			}
		})
	}
})