const app = getApp();
import util from '../../utils/util';
let goodImage = null, shareImage = null, timer = null, num = 0, doubleList= null;

Page({
	data: {
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		loginAnimation: {},
		detail: {},
		load: false,
		customerId: null,
		barrages: [],
		couponData: {
			show: false,
			name: '',
			price: 0
		}
	},

	onLoad() {
		goodImage = null;
		shareImage = null;
		timer = null; num = 0; doubleList= null;
		// 获取session
		util.showLoading();
		app.getSessionId().then(() => {
			this.getData()
		}).catch(err => {
			util.showToast(err)
		});
		wx.hideShareMenu()
	},
	
	onShow(){
		this.hideShareInfo()
	},
	
	// 获取数据
	getData(){
		app.api.getCardInfo(this.options.cardId).then(res => {
			if(res.success){
				let datas = res.data;
				let ortherCustomerLogo = [];
				// 浏览头像
				if(datas.ortherCustomerLogo.length > 0){
					datas.ortherCustomerLogo.forEach(item => {
						if(item){
							if(item.indexOf('http') === -1){
								item = this.data.baseUrl + item
							}
						}else{
							item = this.data.defaultHead
						}
						ortherCustomerLogo.push(item)
					})
				}
				this.setData({
					ortherCustomerLogo: ortherCustomerLogo,
					detail: datas,
					barrages: datas.barrages,
					load: true
				})
				app.changeImg(this.data.baseUrl + res.data.imagePath[0]).then(res => {
					goodImage = res;
					this.draw();
					this.getStatus();
				})
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
				// if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount_B();
				// util.redTo(`goodsDetails/goodsDetails?type=cardin&id=${this.options.cardId}&comeCard=true`);
			}
		}else{
			this.showLogin()
		}
		wx.hideLoading()
	},
	
	// 测款
	like(e){
		const id = e.currentTarget.dataset.id;
		app.api.getisLike(id === 'like' ? true : id === 'unlike' ? false : '', this.options.cardId).then(res => {
			if(res.success){
				util.showToast(res.msg);
				const detail = this.data.detail;
				detail[id] = detail[id] + 1;
				this.setData({
					detail: detail
				})
			}else{
				util.showToast(res.msg)
			}
		})
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
							this.getCusInfo()
						}else{
							util.showToast(res.msg)
						}
					})
				}
			})
		}else if(type === 'user'){
			wx.setStorageSync('isLogin', 'user');
			app.data.isLogin = 'user';
			if(!app.data.isReadingMsg) this.selectComponent('#pushBox').getUnReadMsgCount_B();
			util.redTo(`goodsDetails/goodsDetails?type=cardin&id=${this.options.cardId}&comeCard=true`);
		}
	},
	
	getCusInfo(){
		app.api.getUserInfo().then(res => {
			if(res.success){
				this.setData({
					customerId: res.data[0].customerId
				}, () => {
					wx.createSelectorQuery().select('#bb').fields({
						size: true
					}, res => {
						const {barrages} = this.data;
						const sysInfo = wx.getSystemInfoSync();
						if(res.height > 200 * sysInfo.windowWidth / 750){
							doubleList = barrages.concat(barrages);
							this.setData({
								barrages: doubleList
							})
							this.handleBarrage()
						}
					}).exec();
				})
			}else{
				util.showToast(res.msg)
			}
			
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
		util.navTo(`canvas/canvas?cardId=${this.options.cardId}&customerId=${this.data.customerId}`)
	},
	
	onShareAppMessage(){
		console.log(shareImage);
		const cardId = this.options.cardId;
		let query = `customerId=${this.options.customerId}`;
		return {
			title: this.data.detail.commodityName,
			path: `/pages/goodCard/goodCard?cardId=${cardId}&${query}`,
			imageUrl: shareImage,
			success: () => {
				this.hideShareInfo();
				app.api.goodShareSuc(cardId);
			}
		}
	},
	
	draw(){
		const ctx = wx.createCanvasContext('myCanvas'), {detail} = this.data;
		const likeCenter = 21;
		const unlikeCenter = 189;
		const lookCenter = 105;
		const seeVolume = detail.ortherCustomerRow ? detail.ortherCustomerRow : 0;
		// 背景图
		ctx.drawImage('../../img/card_bg.png', 0, 0, 210, 168);
		
		ctx.drawImage(goodImage, 15, 15, 180, 180);
		
		// 价格
		ctx.setFontSize(12);
		const priceWidth = ctx.measureText(`￥${detail.travelerPrice.toFixed(2)}`).width;
		ctx.setFillStyle('rgba(0, 0, 0, .5)');
		ctx.fillRect(20, 17, priceWidth + 6, 18);
		ctx.setFillStyle('rgba(255, 255, 255, .8)');
		ctx.setTextBaseline('middle');
		ctx.fillText(`￥${detail.travelerPrice.toFixed(2)}`, 23, 25);
		
		// 画三角形
		util.drawTriangle(ctx, 0, 93, 0, 168, 139, 168, '#fff', 'fill');
		util.drawTriangle(ctx, 71, 168, 210, 168, 210, 93, '#fff', 'fill');
		ctx.setShadow(0, -1, 1, 'rgba(151, 151, 151, .5)');
		util.drawTriangle(ctx, 0, 168, 105, 112, 210, 168, '#fff', 'fill');
		
		// 喜欢
		util.getText(ctx, detail.like, likeCenter, 120, 12, '#333');
		util.getText(ctx, '喜欢', likeCenter, 135, 10, '#999');
		// 不喜欢
		util.getText(ctx, detail.unlike, unlikeCenter, 120, 12, '#333');
		util.getText(ctx, '不喜欢', unlikeCenter, 135, 10, '#999');
		
		// 浏览
		ctx.setFontSize(12);
		const lookWidth = ctx.measureText(seeVolume.toString()).width;
		ctx.setFontSize(10);
		const liulanWidth = ctx.measureText('浏览').width;
		const totalWidth = lookWidth + liulanWidth + 6;
		ctx.setFontSize(12);
		ctx.setFillStyle('#333');
		ctx.setTextBaseline('middle');
		ctx.fillText(seeVolume, lookCenter - totalWidth / 2, 135);
		ctx.setFontSize(10);
		ctx.setFillStyle('#999');
		ctx.setTextBaseline('middle');
		ctx.fillText('浏览', lookCenter - totalWidth / 2 + lookWidth + 3, 135);
		
		// 查看商品卡
		ctx.setFontSize(10);
		const btnWidth = ctx.measureText('查看商品卡').width;
		ctx.setFillStyle('#13B5FE');
		ctx.fillRect(lookCenter - btnWidth / 2 - 6, 147, btnWidth + 12, 16);
		ctx.setFillStyle('rgba(255, 255, 255, .5)');
		ctx.setTextBaseline('middle');
		ctx.fillText('查看商品卡', lookCenter - btnWidth / 2, 154);
		// 完成
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
	
	goIm(){
		util.navTo('im/im')
	},
	
	goDetail(){
		util.navTo(`goodsDetails/goodsDetails?type=cus&id=${this.options.cardId}&comeCard=true`)
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
	
	cha(){
		this.setData({
			'couponData.show': false
		})
	}
})