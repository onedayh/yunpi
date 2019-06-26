const app = getApp();
import util from '../../utils/util';
let salerHead = null, shareImage = null, pictrue = null;

Page({
	data: {
		load: false,
		labelList: ['', '客户至上', '专属服务', '合作共赢', ''],
		
		loginAnimation: {},
		showShare: false,
		customerId: null,
		couponData: {
			show: false,
			name: '',
			price: 0
		}
	},
	
	onLoad(){
		salerHead = null; shareImage = null; pictrue = null;
		util.showLoading();
		app.getSessionId().then(() => {
			this.getData()
		}).catch(err => {
			util.showToast(err)
		});
		wx.hideShareMenu()
	},
	
	getData(){
		app.api.getSalerData(this.options.salerId).then(res => {
			if(res.success){
				let datas = res.data;
				app.changeImg(datas.logoPath).then(res1 => {
					salerHead = res1;
					app.changeImg(datas.pictrue).then(res2 => {
						pictrue = res2;
						this.drawSaleCard(datas);
					})
				});
				datas.logoPath = datas.logoPath ? datas.logoPath.indexOf('http') > -1 ? datas.logoPath : app.data.baseUrl + datas.logoPath : app.data.defaultHead;
				this.setData({
					salerData: datas,
					load: true
				})
				setTimeout(() => {
					this.getStatus();
				}, 500)
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 判断状态
	getStatus(){
		const isLogin = wx.getStorageSync('isLogin');
		if(isLogin){
			app.data.isLogin = isLogin;
			if(isLogin === 'customer'){
				this.getCusInfo();
				if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount();
			}else{
				if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount_B();
				util.tabTo(`personOwen/personOwen`);
			}
		}else{
			this.showLogin()
		}
		wx.hideLoading();
	},
	
	// 登录成功
	bindlogin(e){
		const type = e.detail.type;
		if(type === 'customer'){
			wx.hideLoading();
			this.hideLogin();
			this.getCusInfo();
			if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount();
		}else if(type === 'new_customer'){
			let data = {};
			if(this.options.userId){
				data = {
					userId: this.options.userId,
					source: 2
				}
			}else if(this.options.customerId){
				data = {
					parentCustomerId: this.options.customerId,
					source: 1
				}
			}
			wx.login({
				success: res1 => {
					app.api.register({
						...data,
						nickName: app.data.userInfo.nickName,
						avatarUrl: app.data.userInfo.avatarUrl,
						wxacode: res1.code
					}).then(res => {
						if(res.success){
							wx.hideLoading();
							this.hideLogin();
							wx.setStorageSync('isLogin', 'customer');
							app.data.isLogin = 'customer';
							const datas = res.data;
							if(datas.recommendPrize){
								setTimeout(() => {
									this.setData({
										couponData: {
											show: true,
											price: datas.prizePrice,
											name: app.data.userInfo.nickName
										}
									})
								}, 500)
							}
							if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount();
							this.getCusInfo();
						}else{
							util.showToast(res.msg)
						}
					})
				}
			})
		}else if(type === 'user'){
			if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount_B();
			util.tabTo(`personOwen/personOwen`);
		}
	},
	
	// 显示登录
	showLogin(){
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease'
		})
		this.animation = animation;
		animation.top(0).step();
		this.setData({
			loginAnimation: animation.export()
		})
	},
	
	// 隐藏登录
	hideLogin(){
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.top(100+'%').step();
		this.setData({
			loginAnimation: animation.export()
		})
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
		util.navTo(`canvas/canvas?salerId=${this.options.cardId}&customerId=${this.data.customerId}`)
	},
	
	getCusInfo(){
		app.api.getUserInfo().then(res => {
			if(res.success){
				this.setData({
					customerId: res.data[0].customerId
				})
			}else{
				util.showToast(res.msg)
			}
		})
	},
	onShow(){
		this.hideShareInfo()
	},
	
	onShareAppMessage(){
		console.log(shareImage);
		const {salerData, customerId} = this.data, salerId = this.options.salerId;
		return {
			title: salerData.title,
			imageUrl: shareImage,
			path: `/pages/salerCard/salerCard?salerId=${salerId}&customerId=${customerId}`,
			success: () => {
				this.hideShareInfo();
				app.api.recordShareSaler(salerId)
			}
		}
	},
	
	goIm(){
		util.navTo('im/im')
	},
	
	goSale(){
		util.tabTo(`index/index`)
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
		ctx.fillText(datas.nickName, 105, 110);
		// 销售电话
		ctx.setFontSize(10);
		ctx.setTextAlign('left');
		ctx.drawImage('../../img/phone_a.png', 67, 119, 12, 12);
		ctx.fillText(datas.phoneMobile, 79, 128);
		// 服务
		ctx.fillText(`累计服务客户${datas.customerSize}人`, 10, 150);
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
	},
	
	cha(){
		this.setData({
			'couponData.show': false
		})
	}
})