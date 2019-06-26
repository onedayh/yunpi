const app = getApp();
import util from '../../utils/util';
let page = 1,
	pullDown = false,
	top1 = 0,
	top2 = 0,
	top3 = 0,
	n = 0,
	shopHead = null, shopImage = null, myId = null, siteName = '';

Page({
	data: {
		name: '全部商品卡',
		sortId: '',
		allgoodsArry: [],       // 商品列表
		animationData: {},      // 筛选框动画
		show: false,            // 筛选框是否显示
		opts: {
			categoryId: '',     // 分类id
			propName: '',       // 要排序的字段 最近上新:shelvesDate  价格:price
			dir: '',            // 排序 DESC/ASC
			pageSize: app.data.pageSize
		},
		filterList: [],         // 分类列表，
		
		
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		load: false,            // 是否加载过数据，用于请求的数据是否为空
		feedback: '',           // 下拉加载反馈
		canPullDown: false,      // 能否下拉加载
		isLogin: null,
		
		
		tabList: ['商品库', '商品卡', '已下架'],
		acTab: 1,
		text_info: '',
		text_goods: '',
		text_card: '',
		text_time: '',
		
		cardList: [],
		load1: false,
		page1: 1,
		feedback1: '',
		loadMore1: false,
		
		outList: [],
		load2: false,
		page2: 1,
		feedback2: '',
		loadMore2: false,
		
		goodList: [],
		load3: false,
		page3: 1,
		feedback3: '',
		loadMore3: false,
		
		goodsUpdate: false,
		cardUpdate: false,
		outUpdate: false,
		
		handles: false,
		handlesArr: [],
		allHandle: false
	},
	
	onLoad() {
		const that = this;
		pullDown = false;
		page = 1;
		top1 = 0;
		top2 = 0;
		top3 = 0;
		n = 0;
		shopHead = null; shopImage = null; myId = null; siteName = '';
		const isLogin = app.data.isLogin;
		this.setData({
			isLogin: isLogin
		})
		util.showLoading();
		if(isLogin === 'customer'){
			that.getGoodsList();
			that.getInfo();
			app.api.getuserStatus(true);
		}else if(isLogin === 'user'){
			util.setTitle('商品库');
			that.getUserInfo();
			that.getCardList();
		}
	},
	
	onReady(){
		if(!app.data.isReadingMsg && app.data.isLogin === 'customer') this.selectComponent('#pushBox').getUnReadMsgCount();
	},
	
	onShow(){
		if(app.data.isLogin === 'customer'){
			app.toggleRedHot();
			this.setData({
				point: app.data.hasUnReadMsg
			})
		}else if(app.data.isLogin === 'user'){
			app.toggleRedHot_B();
			if(app.data.isPublish){
				this.setData({goodsUpdate: true});
				app.data.isPublish = false
			}
		}
	},
	
	// 获取商品列表
	getGoodsList(){
		page = 1;
		app.api.getGoodsList({...this.data.opts, page: page}).then(res => {
			if(res.success){
				this.setData({
					allgoodsArry: res.data.list,
					load: true
				})
				this.canPull(res.data.lastPage, res.data.totalRecord);
			}else{
				util.showToast(res.msg)
			}
			wx.stopPullDownRefresh();
			pullDown = false;
		})
	},
	
	// 显示筛选框
	showFilter(){
		const that = this;
		if(that.data.filterList.length === 0) that.getFilterList();
		that.setData({show: true}, () => {
			const animation = wx.createAnimation({
				duration: 300,
				timingFunction: 'ease'
			})
			that.animation = animation;
			animation.top(88 + 'rpx').step();
			that.setData({
				animationData:animation.export()
			})
		})
	},
	
	// 隐藏商品筛选框
	hideFilter(){
		const that = this;
		const animation = wx.createAnimation({
			duration: 0
		})
		that.animation = animation;
		animation.top(-450 + 'rpx').step();
		that.setData({
			animationData:animation.export(),
			show: false
		})
	},
	
	// 点击模态层
	hide(e){
		if(e.target.dataset.id === 'mode') this.hideFilter()
	},
	
	// 获取分类列表
	getFilterList(){
		app.api.getFilterList().then(res => {
			this.setData({
				filterList: [{categoryId: '', categoryName: '全部商品卡'}, ...res.data]
			})
		})
	},
	
	// 选择商品分类
	chooseGoods(e){
		const that = this, categoryId = e.target.id;
		that.hideFilter();
		if(categoryId === that.data.opts.categoryId) return;
		let datas = {
			name: that.data.filterList[e.target.dataset.index].categoryName,
			'opts.categoryId': categoryId
		}
		page = 1;
		that.setData(datas, () => {
			that.getGoodsList()
		})
	},
	
	// 上新、价格排序
	sort(e){
		const that = this, _data = that.data, id = e.currentTarget.id;
		if(_data.show) that.hideFilter();
		let propName = _data.opts.propName, dir = _data.opts.dir, sortId = _data.sortId;
		if(id === 'hot'){
			if(sortId === 'hot'){
				sortId = '';
				propName = '';
				dir = '';
			}else{
				sortId = 'hot';
				propName = 'salesVolume';
				dir = 'DESC'
			}
		}else if(id === 'time'){
			if(sortId === 'time'){
				sortId = '';
				propName = '';
				dir = '';
			}else{
				sortId = 'time';
				propName = ' createTime';
				dir = 'DESC'
			}
		}
		let datas = {
			sortId: sortId,
			'opts.propName': propName,
			'opts.dir': dir,
		}
		page = 1;
		that.setData(datas, () => {
			that.getGoodsList()
		})
	},
	
	goGoodsDetail(e) {
		const set = e.currentTarget.dataset;
		app.collectFormId(e.detail.formId);
		if(this.data.handles){
			if(set.disabled){
				const {disabled} = set;
				util.showToast(disabled === 'iscard' ? '这是商品卡，请选择商品' : disabled === 'soldout' ? '该商品卡已由后台下架，请联系管理员' : '');
			}else{
				this.selectHandle(Number(set.id))
			}
		}else{
			util.navTo(`goodsDetails/goodsDetails?id=${set.id}&type=${set.type}&index=${set.index}&num=${set.num ? set.num : ''}`)
		}
	},
	
	// 加载完数据后的反馈
	canPull(lastPage, totalRecord){
		this.setData({
			canPullDown: lastPage ? false : true,
			feedback: lastPage && totalRecord ? '已加载全部数据' : ''
		})
	},
	
	// 下拉加载
	onReachBottom(){
		if(app.data.isLogin === 'customer'){
			const that = this;
			if(!that.data.canPullDown) return;
			that.setData({
				feedback: '加载中...',
				canPullDown: false,
			})
			app.api.getGoodsList({...that.data.opts, page: page + 1}).then(res => {
				if(res.success){
					that.setData({
						allgoodsArry: [...that.data.allgoodsArry, ...res.data.list]
					})
					page ++;
					that.canPull(res.data.lastPage, res.data.totalRecord)
				}else{
					this.setData({
						canPullDown: true,
						feedback: '加载失败，请重试'
					})
				}
			})
		}else if(app.data.isLogin === 'user'){
			const {acTab} = this.data;
			if(acTab === 0){
				this.getMoreCardList(true)
			}else if(acTab === 1){
				this.getMoreCardList()
			} else if(acTab === 2){
				this.getMoreCardList(false, false)
			}
		}
	},
	
	// 上拉刷新
	onPullDownRefresh(){
		const isLogin = app.data.isLogin;
		if(isLogin === 'customer'){
			this.setData({
				feedback: ''
			})
			pullDown = true;
			page = 1;
			this.getGoodsList();
			util.pageTo(0);
		}else if(isLogin === 'user'){
			const acTab = this.data.acTab;
			switch (acTab) {
				case 0:
					this.getCardList(true);
					top1 = 0;
					util.pageTo(top1);
					break;
				case 1:
					this.getCardList();
					top2 = 0;
					util.pageTo(top2);
					break;
				case 2:
					this.getCardList(false, false);
					top3 = 0;
					util.pageTo(top3);
					break;
			}
		}
	},
	
	onPageScroll(e){
		const scrollTop = e.scrollTop;
		const {acTab} = this.data;
		switch (acTab) {
			case 0:
				top1 = scrollTop;
				break;
			case 1:
				top2 = scrollTop;
				break;
			case 2:
				top3 = scrollTop;
				break;
		}
	},
	
	changeTab(e){
		const id = Number(e.currentTarget.dataset.id), {data} = this;
		if(id === data.acTab) return;
		this.setData({
			acTab: id,
			handles: false,
			handlesArr: [],
			allHandle: false
		});
		if(id === 0){
			this.setData({text_info: data.text_goods});
			if(!data.load3 || (data.load3 && data.goodsUpdate)){
				top1 = 0;
				this.getCardList(true)
			}
			util.pageTo(top1);
		}else if(id === 1){
			this.setData({text_info: data.text_card});
			if(!data.load1 || (data.load1 && data.cardUpdate)){
				this.getCardList();
				this.getUserInfo();
				top2 = 0;
			}
			util.pageTo(top2);
		}else if(id === 2){
			if(!data.load2 || (data.load2 && data.outUpdate)){
				this.getCardList(false, false);
				this.getUserInfo();
				top3 = 0;
			}
			util.pageTo(top3)
		}
	},
	
	// 获取销售信息
	getUserInfo(){
		app.api.getInfo_B().then(res => {
			if(res.success){
				const datas = res.data;
				if(!n){
					myId = res.data.infraUserId;
					this.getShopCard();
				}
				this.setData({
					text_card: `共${datas.cardsSize}张商品卡`,
					text_info: `共${datas.cardsSize}张商品卡`,
					text_time: `分享${datas.shareSize}次，被转发${datas.transpondSize}次`,
					logoPath: datas.logoPath ? datas.logoPath.indexOf('http') > -1 ? datas.logoPath : this.data.baseUrl + datas.logoPath : this.data.defaultHead
				})
				n ++;
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	getApi(all = false, put = true, more = 0){
		const {data} = this, {pageSize} = app.data;
		let api = null;
		if(all){
			if(more && !data.loadMore3) return false;
			this.setData({feedback3: '加载中...'});
			api = app.api.getShopList_B({
				page: data.page3 + more,
				pageSize: pageSize
			})
		}else if(put){
			if(more && !data.loadMore1) return false;
			this.setData({feedback1: '加载中...'});
			api = app.api.getCardList_B({
				page: data.page1 + more,
				pageSize: pageSize,
				putaway: put
			})
		}else{
			if(more && !data.loadMore2) return false;
			this.setData({feedback2: '加载中...'});
			api = app.api.getCardList_B({
				page: data.page2 + more,
				pageSize: pageSize,
				putaway: put
			})
		}
		return api
	},
	
	// 获取列表
	getCardList(all = false, put = true){
		let {page1, page2, page3, goodsUpdate, cardUpdate, outUpdate} = this.data;
		if(all){
			page3 = 1;
			goodsUpdate = false;
		}else if(put){
			page1 = 1;
			cardUpdate = false;
		}else{
			page2 = 1;
			outUpdate = false;
		}
		this.setData({
			page1: page1,
			page2: page2,
			page3: page3,
			goodsUpdate: goodsUpdate,
			cardUpdate: cardUpdate,
			outUpdate: outUpdate
		}, () => {
			this.getApi(all, put).then(res => {
				if(res.success){
					const datas = res.data;
					if(all){
						this.setData({
							goodList: datas.list,
							load3: true,
							feedback3: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore3: datas.lastPage ? false : true,
							text_goods: `共${datas.totalRecord}个商品`,
							text_info: `共${datas.totalRecord}个商品`,
						})
					}else if(put){
						this.setData({
							cardList: datas.list,
							load1: true,
							feedback1: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore1: datas.lastPage ? false : true
						})
					}else{
						this.setData({
							outList: datas.list,
							load2: true,
							feedback2: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore2: datas.lastPage ? false : true
						})
					}
				}else{
					if(all){
						this.setData({feedback3: res.msg})
					}else if(put){
						this.setData({feedback1: res.msg})
					}else{
						this.setData({feedback2: res.msg})
					}
				}
				wx.stopPullDownRefresh()
			})
		})
	},
	
	// 加载更多商品卡
	getMoreCardList(all = false, put = true, more = 1){
		const {data} = this;
		let can = this.getApi(all, put, more);
		if(!can) return;
		can.then(res => {
			if(res.success){
				const datas = res.data;
				if(all){
					if(data.allHandle){
						datas.list.forEach(item => {
							if(!item.isCard) data.handlesArr = [...data.handlesArr, item.commodityId]
						})
					}
					this.setData({
						page3: data.page3 + more,
						goodList: data.goodList.concat(datas.list),
						feedback3: datas.lastPage ? '已加载全部数据' : '',
						loadMore3: datas.lastPage ? false : true,
						handlesArr: data.handlesArr
					})
				}else if(put){
					if(data.allHandle){
						datas.list.forEach(item => {
							data.handlesArr = [...data.handlesArr, item.cardId]
						})
					}
					this.setData({
						page1: data.page1 + more,
						cardList: data.cardList.concat(datas.list),
						feedback1: datas.lastPage ? '已加载全部数据' : '',
						loadMore1: datas.lastPage ? false : true,
						handlesArr: data.handlesArr
					})
				}else{
					if(data.allHandle){
						datas.list.forEach(item => {
							data.handlesArr = [...data.handlesArr, item.cardId]
						})
					}
					this.setData({
						page2: data.page2 + more,
						outList: data.outList.concat(datas.list),
						feedback2: datas.lastPage ? '已加载全部数据' : '',
						loadMore2: datas.lastPage ? false : true,
						handlesArr: data.handlesArr
					})
				}
			}else{
				if(all){
					this.setData({
						feedback3: res.msg,
						loadMore3: true
					})
				}else if(put){
					this.setData({
						feedback1: res.msg,
						loadMore1: true
					})
				}else{
					this.setData({
						feedback2: res.msg,
						loadMore2: true
					})
				}
			}
		})
	},
	
	getform(e){
		app.collectFormId(e.detail.formId)
	},
	
	// 客服
	formbutton(e){
		app.collectFormId(e.detail.formId);
		util.navTo(`im/im`)
	},
	
	/*
	* 批量操作
	*/
	// 显示选择框
	changeHandle(){
		this.setData({
			handles: !this.data.handles,
			handlesArr: [],
			allHandle: false
		})
	},
	
	// 批量操作
	handleSet(){
		const {handlesArr, acTab, cardUpdate, outUpdate} = this.data;
		if(handlesArr.length > 0){
			if(acTab === 0){
				app.api.batchSetCard_B(handlesArr.join(',')).then(res => {
					if(res.success){
						util.showToast('商品卡设置成功', 'success');
						this.changeHandle();
						wx.startPullDownRefresh();
						this.setData({
							cardUpdate: true
						})
					}else{
						util.showToast(res.msg)
					}
				})
			}else{
				app.api.batchPutaway_B(handlesArr.join(','), acTab === 1 ? false : true).then(res => {
					if(res.success){
						util.showToast(`商品卡${acTab === 1 ? '下' : '上'}架成功`, 'success');
						this.changeHandle();
						this.setData({
							goodsUpdate: true,
							cardUpdate: acTab === 1 ? cardUpdate : true,
							outUpdate: acTab === 1 ? true : outUpdate
						})
						wx.startPullDownRefresh();
					}else{
						util.showToast(res.msg)
					}
				})
			}
		}else{
			util.showToast(`请先选择商品${acTab === 0 ? '' : '卡'}`)
		}
	},
	
	// 全选
	allSelect(){
		let {handlesArr, acTab, allHandle} = this.data;
		if(allHandle){
			this.setData({
				allHandle: false,
				handlesArr: []
			})
		}else{
			if(acTab === 0){
				const {goodList} = this.data;
				goodList.forEach(item => {
					if(!item.isCard) handlesArr = [...handlesArr, item.commodityId]
				})
			}else if(acTab === 1){
				const {cardList} = this.data;
				cardList.forEach(item => {
					handlesArr = [...handlesArr, item.cardId]
				})
			}else if(acTab === 2){
				const {outList} = this.data;
				outList.forEach(item => {
					if(!item.soldOut) handlesArr = [...handlesArr, item.cardId]
				})
			}
			this.setData({
				allHandle: handlesArr.length > 0 ? true : false,
				handlesArr: handlesArr
			})
		}
		
	},
	
	// 单选
	selectHandle(id){
		let {handlesArr, acTab} = this.data, useList = [];
		const index = handlesArr.indexOf(id);
		if(index > -1){
			handlesArr.splice(index, 1)
		}else{
			handlesArr.push(id);
		}
		if(acTab === 0){
			const {goodList} = this.data;
			useList = goodList.filter(item => !item.isCard);
		}else if(acTab === 1){
			useList = this.data.cardList;
		}else if(acTab === 2){
			const {outList} = this.data;
			useList = outList.filter(item => !item.soldOut);
		}
		this.setData({
			allHandle: useList.length === handlesArr.length ? true : false,
			handlesArr: handlesArr
		})
	},
	
	getInfo(){
		app.api.getUserInfo().then(res => {
			myId = res.data[0].customerId;
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
	
	onShareAppMessage(){
		console.log(shopImage);
		const query = this.data.isLogin === 'user' ? `userId=${myId}` : `customerId=${myId}`;
		return {
			title: `你好，为你推荐${siteName}，里面有海量爆款，还有小程序专属优惠哦！`,
			imageUrl: shopImage,
			path: `/pages/shopCard/shopCard?${query}`,
		}
	},
})