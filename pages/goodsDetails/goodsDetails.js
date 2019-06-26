import util from '../../utils/util';
const app = getApp();
let isScroll = false,	// 页面是否在滚动
	handleAdd = true,	// 是否加入购物车，防止多次点击
	seconds = 0,		// 浏览时长
	lookTimer = null,	// 记录浏览时长定时器
	hideTimer = null,   // 记录小程序后台运行或页面隐藏定时器
	isHide = false,     // 页面是否隐藏
	
	setCard = false,
	reSetCard = false,
	outCard = false,
	
	shareImage = null,
	goodImage = null,
	
	inid = null;		// 上架id

Page({
	data: {
		baseUrl: app.data.baseUrl,
		showModalStatus: false,
		list: [],
		detail: {
		    price: 0
        },
		selectedId: 1,
		scroll: true,
		height: 42,
		info: [],
		commodityId: '',
		isScroll: true,
        load: false,
        fromIM: false,
        animationData: {},
		showShare: false
	},
	
	onLoad(e) {
		shareImage = null;
		goodImage = null;
		isScroll = false;
		seconds = 0;
		lookTimer = null;
		handleAdd= true;
		setCard = false;
		reSetCard = false;
		outCard = false;
		inid = null;
		util.showLoading();
		this.setData({
			isLogin: app.data.isLogin,
			type: e.type,
			fromIM: e.from ? true : false,
			comeCard: e.comeCard ? true : false
		})
		if(e.type === 'goods') util.setTitle('商品详情');
		if(e.type !== 'cus') wx.hideShareMenu();
		this.getData(e);
	},
	
	onShow(){
		if(!app.data.isPreview){
			isHide = false;
			if(app.data.isLogin === 'customer' && this.data.load) this.getTime();
		}else{
			app.data.isPreview = false;
		}
		this.hideShareInfo()
	},
	
	onHide(){
		if(!app.data.isPreview){
			isHide = true;
			if(seconds){
				this.sendTime(seconds);
				seconds = 0;
			}
		}
	},
	
	onUnload() {
		const {isLogin} = app.data;
		if(isLogin === 'customer'){
			if(lookTimer) clearInterval(lookTimer);
			if(hideTimer) clearInterval(hideTimer);
			let data = {
				cardId: this.data.commodityId,
				isCollect: this.data.detail.isCollect
			}
			if(seconds && this.data.load) this.sendTime(seconds);
			wx.setStorageSync('collectData', data)
		}else if(isLogin === 'user'){
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];
			const {index, type} = this.options;
			if(setCard && type === 'goods'){
				// 商品库   设为商品
				let {goodList} = prevPage.data;
				goodList[index].isCard = true;
				goodList[index].cardId = inid;
				goodList[index].putaway = true;
				prevPage.setData({
					cardUpdate: true,
					goodList: goodList
				})
			}
			if(reSetCard){
				// 上架
				if(type === 'cardout'){
					// 已下架
					let {outList, feedback2} = prevPage.data;
					outList.splice(index, 1);
					prevPage.setData({
						outList: outList,
						feedback2: outList.length === 0 ? '' : feedback2,
						cardUpdate: true,
						goodsUpdate: true
					})
				}else if(type === 'goodout'){
					// 商品库
					let {goodList} = prevPage.data;
					goodList[index].putaway = true;
					prevPage.setData({
						cardUpdate: true,
						outList: true,
						goodList: goodList
					})
				}
			}
			if(outCard){
				// 下架
				if(type === 'cardin'){
					// 商品卡
					let {cardList, feedback3} = prevPage.data;
					cardList.splice(index, 1);
					prevPage.setData({
						feedback3: cardList.length === 0 ? '' : feedback3,
						cardList: cardList,
						outUpdate: true,
						goodsUpdate: true
					})
				}else if(type === 'goodcar'){
					// 商品库
					let {goodList} = prevPage.data;
					goodList[index].putaway = false;
					prevPage.setData({
						goodList: goodList,
						cardUpdate: true,
						outUpdate: true
					})
				}
			}
		}
	},

	closeWin() {
		this.setData({
			showModalStatus: false,
			isScroll: true
		})
	},

	powerDrawer() {
		if(this.data.detail.putaway){
			this.setData({
				showModalStatus: true,
				isScroll: false
			})
		}else{
			util.showToast('抱歉，该商品已下架')
		}
	},

	selectTab(e) {
		this.setData({
			selectedId: e.detail
		})
	},

	goShoppingCar() {
		wx.navigateTo({
			url: '../shoppingCar/shoppingCar',
		})
	},

	popUp() {
		wx.showToast({
			title: '加入购物车',
			icon: 'success',
			duration: 2000
		})
	},
	
	preview() {
		app.data.isPreview = true;
		let arr = [];
		this.data.detail.imagePath.forEach(item => {
		    arr.push(this.data.baseUrl + item + '?s=720')
        })
		wx.previewImage({
			current: arr[0],
			urls: arr
		})
	},
	
	getApi(type, id){
		let api = null;
		switch (type) {
			case 'cus':
				api = app.api.productDetail(id);
				break;
			case 'goods':
				api = app.api.goodDetail_B(id);
				break;
			case 'cardin':
			case 'goodcar':
				api = app.api.cardDetail_B(id);
				break;
			case 'cardout':
			case 'goodout':
				api = app.api.cardDetail_B(id);
				break;
		}
		return api
	},

    getData(e){
		this.getApi(e.type, e.id).then(res => {
            if (res.success) {
                //重构后台数据
				const isLogin = app.data.isLogin;
				const datas = e.type === 'goods' ? res.data[0] : res.data;
                let param = datas.param;
                let arr = [];
                for (let i in param) {
                    arr.push({
                        'title': i,
                        'size': param[i]
                    })
                }
                arr.forEach((item, index) => {
                    item.id = parseInt(index) + 1;
                    item.count = 0;//规格总量
                    item.size.forEach(val => {
                        val.count = 0
                    })
                })
				if(this.options.num && e.type === 'goodcar' || e.type === 'goodout') datas.salesVolume = this.options.num ? this.options.num : 0;
				if(datas.allPrice) datas.allPrice = Object.entries(datas.allPrice);
                this.setData({
                    list: arr,
                    detail: datas,
                    info: datas.info ? JSON.parse(datas.info) : null,
                    commodityId: e.id,
                    load: true
                }, () => {
					wx.hideLoading();
					if(e.type === 'cus'){
						this.getTime()
					}
					if(e.type === 'goodcar' || e.type === 'cardin' || e.type === 'cus'){
						app.changeImg(this.data.baseUrl + datas.imagePath[0]).then(res => {
							goodImage = res;
							this.draw()
						})
					}
				})
            } else {
                util.showToast(res.msg)
            }
        })
    },

	collect() {
	    util.showLoading();
		let detail = this.data.detail;
		let commodityId = this.data.commodityId;
		if (!detail.isCollect) {//收藏
			app.api.collectGoods(commodityId).then(res => {
				if (res.success) {
				    util.showToast('收藏成功', 'success');
                    detail.isCollect = true;
                    this.setData({
                        detail: detail
                    })
				}else{
                    util.showToast('操作失败')
                }
			})
		} else {//取消收藏
			app.api.cancelCollect(commodityId).then(res => {
				if (res.success) {
                    util.showToast('取消收藏成功');
                    detail.isCollect = false;
                    this.setData({
                        detail: detail
                    })
				}else{
                    util.showToast('操作失败')
                }
			})
		}
	},

	add(e){
		let list = this.data.list;
		const selectedId = this.data.selectedId - 1;
        if(list[selectedId].count >= 999) return;
		const index = e.currentTarget.dataset.index;
		list[selectedId].size[index].count++;
		list[selectedId].count++;
		this.setData({
			list: list
		})
	},

	minus(e) {
		let list = this.data.list;
		const selectedId = this.data.selectedId - 1;
		const index = e.currentTarget.dataset.index;
		list[selectedId].size[index].count--;
		list[selectedId].count--;
		this.setData({
			list: list
		})
	},

	changeNumber(e) {
		let list = this.data.list;
		let value = parseInt(e.detail.value);
		const selectedId = this.data.selectedId - 1;
		const index = e.currentTarget.dataset.index;
		if (value >= 0 && value <= 999) {
			list[selectedId].size[index].count = value
		} else if(value < 0) {
			list[selectedId].size[index].count = 0
		}else{
            list[selectedId].size[index].count = 999
        }
		//每次改变input的值重新计算对应规格的count
		let count = 0;
		list[selectedId].size.forEach(item => {
			count += item.count
		})
		if (!count) {
			count = 0
		}
		list[selectedId].count = count;
		this.setData({
			list: list
		})
	},

	addCart(e) {
		app.collectFormId(e.detail.formId);
	    if(!handleAdd) return;
	    handleAdd = false;
		let list = this.data.list;
		let detail = this.data.detail;
		let stock = [];
		list.forEach(item => {
			item.size.forEach(val => {
				if (val.count > 0) {
					stock.push({
						detailId: val.detailId,
						number: val.count,
						cardId: this.data.commodityId
					})
				}
			})
		})

		if (stock.length === 0) {
			util.showToast('请选择商品的规格和数量');
            setTimeout(() => {
                handleAdd = true
            }, 500)
			return false;
		}
		const str = JSON.stringify(stock);
		app.api.addShopCart(str).then(res => {
			if (res.success) {
				wx.showToast({
					title: '添加购物车成功',
					success: data => {
						list.forEach(item => {
							item.count = 0;
							item.size.forEach(val => {
								val.count = 0
							})
						})
						detail.cartCount = parseInt(detail.cartCount) + 1;
						this.setData({
							list: list,
							detail: detail,
							showModalStatus: false
						}, () => {
						    setTimeout(() => {
						        handleAdd = true
                            }, 500)
                        })
					}
				})
			}else{
                util.showToast(res.msg);
				setTimeout(() => {
					handleAdd = true
				}, 500)
            }
		})

	},

    back(){
	    util.navBack(1)
    },

    formbutton(e){
        util.showLoading();
        app.api.sendGoodsToIm(this.data.commodityId).then(res => {
            if (res.success) {
				app.collectFormId(e.detail.formId);
                util.navTo(`im/im`)
            } else {
                util.showToast(res.msg)
            }
        })
    },

    goIndex(){
        util.tabTo(`index/index`)
    },
	
	// 发送浏览时长
	sendTime(seconds){
		const data = {
			cardId: this.options.id,
			seconds: seconds
		}
		app.api.timeOfGoodDetail(data)
	},
	
	// 记录浏览时长
	getTime(){
		// 记录浏览时长
		if(lookTimer) clearInterval(lookTimer);
		lookTimer = setInterval(() => {
			if((isHide || app.data.isHide) && !app.data.isPreview){
				/*
				* 当 页面隐藏 || 小程序后台运行 =>
				* 1、添加新的定时器 hideTimer，当页面正常时停止，并恢复 lookTimer
				* 2、停止 lookTimer
				*/
				if(lookTimer) clearInterval(lookTimer);
				if(hideTimer) clearInterval(hideTimer);
				hideTimer = setInterval(() => {
					if(!isHide && !app.data.isHide){
						clearInterval(hideTimer);
						this.getTime()
					}
				}, 1000)
			}
			seconds ++;
			console.log(seconds);
		}, 1000)
	},
	
	set(e){
		const type = e.currentTarget.id, {id} = this.options;
		switch (type) {
			case 'in':
				this.setCard(id);
				break;
			case 'out':
				this.setCardStatus(id, false);
				break;
			case 'reset':
				this.setCardStatus(id, true);
				break;
			case 'share':
				this.showShareInfo();
				break;
			case 'look':
				util.navTo(`cardData/cardData?id=${id}`);
				break;
		}
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
		let query = '';
		const {detail, isLogin} = this.data;
		if(isLogin === 'user'){
			query = `userId=${detail.userId}`;
		}else {
			query = `customerId=${detail.customerId}`;
		}
		util.navTo(`canvas/canvas?cardId=${this.options.id}&${query}`)
	},
	
	// 设为商品卡
	setCard(id){
		util.showLoading();
		app.api.setCard_B(id).then(res => {
			if(res.success){
				util.showToast('商品卡设置成功', 'success');
				inid = res.data.cardId;
				setCard = true;
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 商品卡上下架
	setCardStatus(id, putaway){
		util.showLoading();
		app.api.setCardStatus_B(id, putaway).then(res => {
			if(res.success){
				util.showToast(`商品卡${putaway ? '上架' : '下架'}成功`, 'success');
				if(putaway){
					reSetCard = true;
					inid = res.data.cardId;
				}else{
					outCard = true;
				}
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	onShareAppMessage(){
		const {isLogin, type, detail} = this.data;
		let cardId = this.options.id, query = '';
		if(isLogin === 'user'){
			if(
				// 是商品且设为商品卡
				(type === 'goods' && setCard) ||
				// 已下架且重新上架
				((type === 'goodout' || type === 'cardout') && reSetCard)
			){
				cardId = inid
			}
			query = `userId=${detail.userId}`;
		}else{
			query = `customerId=${detail.customerId}`;
		}
		console.log(shareImage);
		return {
			title: detail.commodityName,
			path: `/pages/goodCard/goodCard?cardId=${cardId}&${query}`,
			imageUrl: shareImage,
			success: () => {
				if(isLogin === 'customer'){
					app.api.goodShareSuc(cardId)
				}else if(isLogin === 'user'){
					app.api.goodShareSuc_B(cardId)
				}
			}
		}
	},
	
	draw(){
		const ctx = wx.createCanvasContext('myCanvas'), {detail} = this.data;
		const likeCenter = 21;
		const unlikeCenter = 189;
		const lookCenter = 105;
		const seeVolume = detail.seeVolume ? detail.seeVolume : 0;
		// 背景图
		ctx.drawImage('../../img/card_bg.png', 0, 0, 210, 168);
		
		ctx.drawImage(goodImage, 15, 15, 180, 180);
		
		// 价格
		const price = this.options.type === 'cus' ?　detail.travelerPrice : detail.price;
		ctx.setFontSize(12);
		const priceWidth = ctx.measureText(`￥${price.toFixed(2)}`).width;
		ctx.setFillStyle('rgba(0, 0, 0, .5)');
		ctx.fillRect(20, 17, priceWidth + 6, 18);
		ctx.setFillStyle('rgba(255, 255, 255, .8)');
		ctx.setTextBaseline('middle');
		ctx.fillText(`￥${price.toFixed(2)}`, 23, 25);
		
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
	
	
})