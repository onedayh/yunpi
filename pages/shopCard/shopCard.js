const app = getApp();
import util from '../../utils/util';
let timer = null, num = 0, doubleList= null, shopHead = null, shareImage = null;
Page({
	data: {
		load: false,
		shopData: null,
		customerId: null,
		loginAnimation: {},
		spreadAnimate: {},
		listHeight: 0,
		slHei: 0,
		icon: '',
		intoView: null,
		scAni: true,
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		couponData: {
			show: false,
			name: '',
			price: 0
		}
	},
	
	onLoad(){
		timer = null;
		doubleList = null;
		num = 0;
		shopHead = null;
		shareImage = null;
		util.showLoading();
		app.getSessionId().then(() => {
			const sysInfo = wx.getSystemInfoSync();
			this.setData({
				slHei: sysInfo.windowHeight - 730 * sysInfo.windowWidth / 750
			})
			this.getData()
		}).catch(err => {
			util.showToast(err)
		});
	},
	
	getData(){
		app.api.getShopCard().then(res => {
			if(res.success){
				const datas = res.data, len = datas.infraOrganization.length;
				this.setData({
					shopData: datas,
					barrages: datas.barrages,
					load: true,
					len: len,
					icon: len > 2 ? 'down' : '',
					listHeight: len > 2 ? 330 : len * 160 + 10
				})
				util.setTitle(datas.siteName);
				setTimeout(() => {
					this.getStatus();
				}, 500);
				app.changeImg(datas.picture).then(res1 => {
					shopHead = res1;
					this.drawShopCard(datas)
				});
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 复制 && 拨打
	handle(e){
		const {type, content} = e.currentTarget.dataset;
		if(type === 'call'){
			wx.makePhoneCall({
				phoneNumber: content
			})
		}else if(type === 'copy'){
			wx.setClipboardData({
				data: content,
				success: () => {
					util.showToast('复制成功', 'success')
				}
			})
		}
	},
	
	getMore(e){
		let icon = e.currentTarget.dataset.icon;
		if(icon === 'down'){
			this.showMore()
		}else if(icon === 'up'){
			this.hideMore()
		}
	},
	
	showMore(){
		const len = this.data.len;
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.height(len * 160 + 10 + 'rpx').step();
		this.setData({
			icon: 'up',
			spreadAnimate: animation
		})
	},
	
	hideMore(){
		let animation = wx.createAnimation({
			duration: 500,
			timingFunction: 'ease',
		})
		this.animation = animation;
		animation.height(310 + 'rpx').step();
		this.setData({
			icon: 'down',
			spreadAnimate: animation
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
	
	getCusInfo(){
		app.api.getUserInfo().then(res => {
			if(res.success){
				this.setData({
					customerId: res.data[0].customerId
				})
				wx.createSelectorQuery().select('#bb').fields({
					size: true
				}, res => {
					const {slHei, barrages} = this.data;
					if(res.height > slHei){
						doubleList = barrages.concat(barrages);
						this.setData({
							barrages: doubleList
						})
						this.handleBarrage()
					}
				}).exec();
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	goNext(e){
		const id = e.currentTarget.id;
		if(id === 'intro'){
			util.navTo(`aboutus/aboutus`)
		}else if(id === 'look'){
			util.tabTo(`index/index`)
		}
	},
	
	onShareAppMessage(){
		console.log(shareImage);
		return {
			title: `你好，为你推荐${this.data.shopData.siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
			imageUrl: shareImage,
			path: `/pages/shopCard/shopCard?customerId=${this.data.customerId}`,
		}
	},
	
	// 弹幕处理
	handleBarrage(){
		timer = setTimeout(() => {
			if(num >= doubleList.length / 2){
				num = 0;
			}else{
				num ++;
			}
			this.setData({
				scAni: num === doubleList.length / 2 ? false : true,
				intoView: `id${num}`
			})
			this.handleBarrage()
		}, 5000)
	},
	
	onUnload(){
		clearTimeout(timer)
	},
	
	drawShopCard(datas){
		const ctx = wx.createCanvasContext('myCanvas');
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