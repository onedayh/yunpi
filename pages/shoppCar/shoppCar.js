import util from '../../utils/util.js';
import webim from '../../IM/webim_wx';
import webimhandler from '../../IM/webim_handler';

const app = getApp();
let openD = false, allData = null, shopHead = null, shopImage = null, myId = null, siteName = '';


Page({
	data: {
		list: [],
		allSelect: "circle",
		num: 0,
		count: 0,
		delIndex: 0,
		startX: 0,
		startY: 0,
		openDel: false,
		
		load: false,
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		isLogin: null,
		chatList: [],
		levelList: ['', '黄钻', '白钻', '黑钻'],
		load2: false,
		
		activity: [],
		keyword: '',
		
		iconY: 0,
	},
	onLoad() {
		allData = null;
		shopHead = null;
		shopImage = null;
		myId = null;
		siteName = '';
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
		openD = false;
		this.setData({
			isLogin: isLogin,
			winHei: wx.getSystemInfoSync().windowHeight,
			iconY: wx.getSystemInfoSync().windowHeight - 150
		})
		util.showLoading();
		if (isLogin === 'customer') {
			this.getActivity();
			this.getUserInfo();
		}
		if (isLogin === 'user') {
			util.setTitle('消息');
			this.getInfo();
		}
	},
	
	// 获取销售信息
	getInfo() {
		app.api.getInfo_B().then(res => {
			myId = res.data.infraUserId;
			this.getShopCard();
		})
	},
	
	getUserInfo() {
		app.api.getUserInfo().then(res => {
			myId = res.data[0].customerId;
			this.getShopCard();
		})
	},
	
	getShopCard() {
		app.api.getShopCard().then(res => {
			if (res.success) {
				let datas = res.data;
				siteName = datas.siteName;
				app.changeImg(datas.picture).then(res1 => {
					shopHead = res1;
					this.drawShopCard(datas)
				});
			} else {
				util.showToast(res.msg)
			}
		})
	},
	
	drawShopCard(datas) {
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
	
	onShareAppMessage() {
		console.log(shopImage);
		const query = this.data.isLogin === 'user' ? `userId=${myId}` : `customerId=${myId}`;
		return {
			title: `你好，为你推荐${siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
			imageUrl: shopImage,
			path: `/pages/shopCard/shopCard?${query}`,
		}
	},
	
	getActivity() {
		app.api.getActivity().then(res => {
			if (res.success) {
				this.setData({
					activity: res.data
				})
			} else {
				util.showToast(res.msg)
			}
		})
	},
	
	// 客服
	formbutton(e) {
		app.collectFormId(e.detail.formId);
		util.navTo(`im/im`)
	},
	
	onShow() {
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
		if (isLogin === 'customer') {
			const that = this;
			this.getShopcarList();
			this.setData({
				allSelect: 'circle',
				count: 0,
				point: app.data.hasUnReadMsg
			})
			app.toggleRedHot()
		} else if (isLogin === 'user') {
			this.getChatList();
			app.toggleRedHot_B();
		}
	},
	
	getShopcarList() {
		app.api.getShopcarList().then(res => {
			if (res.success) {
				let datas = res.data;
				datas.forEach(item => {
					app.data.shopcar.some(it => {
						if (item.detailCarId === it.detailCarId) {
							item.change = it.change;
							item.sku.number += it.change
						}
					})
					item.select = 'circle'
				})
				this.setData({
					list: datas,
					load: true
				})
			} else {
				util.showToast(res.msg)
			}
		})
	},
	
	touchS(e) {
		const that = this;
		if (e.touches.length === 1) {
			openD = that.data.openDel;
			that.setData({
				//记录触摸起始位置的X坐标
				startX: e.touches[0].clientX,
				startY: e.touches[0].clientY,
				openDel: that.data.delIndex === e.currentTarget.dataset.index ? that.data.openDel : false
			});
		}
	},
	
	touchM(e) {
		util.debounce(this.touchMove(e), 500)
	},
	
	touchMove(e) {
		const that = this;
		if (e.touches.length === 1) {
			//触摸点X坐标  起始点的X坐标与当前触摸点的X坐标的差值
			let moveX = e.touches[0].clientX,
				disX = that.data.startX - moveX,
				moveY = e.touches[0].clientY,
				disY = that.data.startY - moveY;
			if (disX >= 100 && disY <= 60) {
				setTimeout(() => {
					that.setData({
						openDel: true,
						delIndex: e.currentTarget.dataset.index,
					})
				}, openD ? 200 : 0)
			} else if (disX <= -50) {
				that.setData({
					openDel: false
				})
			}
		}
	},
	
	//改变选框状态
	change(e) {
		if (e.target.dataset.id) return;
		const that = this,
			index = e.currentTarget.dataset.index,
			select = e.currentTarget.dataset.select;
		let stype = select === "circle" ? "success" : "circle";
		let newList = that.data.list;
		newList[index]['select'] = stype;
		// 是否全部选中
		let all = newList.every(item => {
			return item.select === 'success'
		})
		that.setData({
			list: newList,
			allSelect: all ? 'success' : 'circle'
		})
		that.computed()
	},
	
	// 改变商品数量
	changeCount(e) {
		const that = this, dataset = e.currentTarget.dataset, newList = that.data.list;
		let num = dataset.num,
			type = dataset.type,
			index = dataset.index,
			change = newList[index].change || 0;
		if (type === 'add') {
			if (num === 999) return;
			change++;
			num++
		} else if (type === 'reduce') {
			if (num === 1) return;
			change--;
			num--
		}
		newList[index].sku.number = num;
		newList[index].change = change;
		that.setData({
			list: newList
		})
		that.computed()
	},
	
	//全选
	allSelect(e) {
		const that = this;
		let allSelect = e.currentTarget.dataset.select,
			newList = that.data.list,
			select = '';
		if (allSelect === "circle") {
			newList.forEach(item => {
				item.select = 'success'
			})
			select = "success"
		} else if (allSelect === "success") {
			newList.forEach(item => {
				item.select = 'circle'
			})
			select = "circle"
		}
		that.setData({
			list: newList,
			allSelect: select
		})
		that.computed()
	},
	
	//计算总数量和总价格
	computed() {
		const that = this;
		let newList = that.data.list,
			allNum = 0,
			allPrice = 0;
		newList.forEach(item => {
			if (item.select === 'success') {
				allNum += parseInt(item.sku.number);
				allPrice += item.sku.number * item.price
			}
		})
		that.setData({
			num: allNum,
			count: allPrice
		})
	},
	
	// 删除
	delete(e) {
		const that = this,
			dataset = e.currentTarget.dataset;
		util.showModal('提示', '确定删除该商品吗', res => {
			if (res.confirm) {
				app.api.deleteShopcar(dataset.id).then(res1 => {
					if (res1.success) {
						let list = that.data.list;
						list.splice(dataset.index, 1);
						const data = {
							list: list,
							openDel: false,
							allSelect: list.length === 0 ? 'circle' : that.data.allSelect
						}
						that.setData(data, () => {
							that.computed()
						})
						util.showToast('删除成功', 'success');
						app.data.shopcar.some((item, index) => {
							if (item.detailCarId === dataset.id) {
								app.data.shopcar.splice(index, 1);
							}
						})
					} else {
						util.showToast(res1.msg)
					}
				})
			}
		})
	},
	
	// 下单
	placeOrder() {
		app.api.collectFormId();
		const that = this;
		const canOrder = that.data.list.some(item => {
			return item.select === 'success'
		})
		if (!canOrder) {
			util.showToast('请先选择商品');
			return
		}
		let orderList = [];
		that.data.list.forEach(item => {
			if (item.select === 'success') {
				orderList.push({
					detailCarId: item.detailCarId,
					number: item.sku.number
				})
			}
		})
		util.navTo(`defaultOrder/defaultOrder?detailCarIds=${JSON.stringify(orderList)}`)
	},
	
	goGoods() {
		app.api.collectFormId();
		util.tabTo('allGoods/allGoods')
	},
	
	onHide() {
		let changeList = this.data.list.filter(item => {
			return item.change && item.change !== 0
		})
		if (changeList.length > 0) {
			let shopcar = [];
			changeList.forEach(item => {
				shopcar.push({
					detailCarId: item.detailCarId,
					change: item.change
				})
			})
			app.data.shopcar = shopcar;
		} else {
			app.data.shopcar = []
		}
	},
	
	goIm(e) {
		app.collectFormId(e.detail.formId);
		util.navTo(`im/im?toAccount=${e.currentTarget.dataset.id}`);
	},
	
	goList() {
		app.data.msgToIndex = true;
		util.tabTo('index/index');
	},
	
	bindinput(e) {
		const value = e.detail.value;
		if (value === '') {
			this.setData({
				chatList: allData
			})
		}
		this.setData({
			keyword: value
		})
	},
	
	getChatList() {
		app.api.getChatList_B(this.data.keyword).then(res => {
			if (res.success) {
				const datas = res.data;
				datas.forEach(item => {
					let time = item.createTime.split(' ');
					if (time.length > 1) {
						item.createTime = time[0]
					}
					let logoUrl = item.logoUrl;
					if (logoUrl) {
						if (logoUrl.indexOf('http') === -1) {
							logoUrl = app.data.baseUrl + logoUrl
						}
					} else {
						logoUrl = app.data.defaultHead
					}
					item.logoUrl = logoUrl;
				})
				this.setData({
					chatList: datas,
					load2: true
				})
				if (this.data.keyword === '') allData = datas;
			} else {
				util.showToast(res.msg)
			}
		})
	},
	
	icontouchmove(e) {
		if (e.touches.length === 1) {
			let moveY = e.touches[0].clientY, winHei = this.data.winHei;
			if(moveY >= winHei - 50) moveY = winHei - 50;
			if(moveY <= 0) moveY = 0;
			this.setData({
				iconY: moveY
			})
		}
	},
	
	onReady(){
		if(!app.data.isReadingMsg && app.data.isLogin === 'customer') this.selectComponent('#pushBox').getUnReadMsgCount();
	},
	
})