import util from "../../utils/util";
const app = getApp();
let timer = null;

Component({
	data: {
		baseUrl: app.data.baseUrl,
		defaultHead: app.data.defaultHead,
		pushData: {},
		animationData: {},
		isLogin: null
	},
	
	ready(){
		this.setData({
			isLogin: app.data.isLogin
		})
	},

	methods: {
		// 显示消息
		showPush(){
			let animation = wx.createAnimation({
				duration: 300,
				timingFunction: 'ease',
			})
			this.animation = animation;
			animation.top(20 + 'rpx').step();
			this.setData({
				animationData: animation.export()
			})
		},
		
		// 隐藏消息
		hidePush(){
			let animation = wx.createAnimation({
				duration: 300,
				timingFunction: 'ease',
			})
			this.animation = animation;
			animation.top(-150 + 'rpx').step();
			this.setData({
				animationData: animation.export()
			})
		},
		
		// 查看消息
		look(e){
			clearTimeout(timer);
			const pages = getCurrentPages();
			const curPage = pages[pages.length - 1];
			const curRoute = curPage.route;
			const pushBox = curPage.selectComponent('#pushBox');
			pushBox.hidePush();
			const {isLogin} = this.data;
			if(isLogin === 'customer'){
				if(this.data.pushData.page.indexOf(curRoute) === -1){
					wx.navigateTo({
						url: this.data.pushData.page
					})
				}
			}else if(isLogin === 'user'){
				const type = Number(e.currentTarget.dataset.type);
				if(type === 1){
					if(curRoute.indexOf('index/index') === -1) util.tabTo(`index/index`)
				}else if(type === 2){
					if(curRoute.indexOf('im/im') === -1) util.navTo(`im/im?toAccount=${e.currentTarget.dataset.im}`)
				}
			}
			
		},
		
		getUnReadMsgCount_B(){
			return new Promise(() => {
				app.data.isReadingMsg = true;
				wx.request({
					url: app.data.baseUrl + '/wxab/msg-long-polling.htm',
					method: 'POST',
					header: {
						'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
						'content-type': 'application/x-www-form-urlencoded'
					},
					success: res => {
						if (res.statusCode === 200) {
							const datas = res.data;
							if (datas.code == '') {
								const pages = getCurrentPages();
								const curPage = pages[pages.length - 1];
								const curRoute = curPage.route;
								const pushBox = curPage.selectComponent('#pushBox');
								let logo = datas.data.logo;
								if(logo){
									if(logo.indexOf('http') === -1){
										logo = this.data.baseUrl + logo
									}
								}else{
									logo = this.data.defaultHead
								}
								datas.data.logo = logo;
								pushBox.setData({
									pushData: datas.data
								})
								clearTimeout(timer);
								pushBox.showPush();
								if(datas.data.type === 2){
									if(curRoute === 'pages/index/index' || curRoute === 'pages/personOwen/personOwen' || curRoute === 'pages/shoppCar/shoppCar' || curRoute === 'pages/allGoods/allGoods'){
										wx.showTabBarRedDot({index: 2});
										if(curRoute === 'pages/shoppCar/shoppCar') curPage.getChatList();
									}
									app.data.hasUnReadMsg = true;
								}else if(datas.data.type === 1){
									if(curRoute === 'pages/index/index'){
										curPage.getClueList_B();
										curPage.setData({showType: 1})
									}
								}
								timer = setTimeout(() => {
									pushBox.hidePush()
								}, 5000);
								this.getUnReadMsgCount_B()
							}else{
								// util.showToast(datas.msg);
								app.data.isReadingMsg = false;
							}
						} else {
							util.showToast(res.errMsg);
							app.data.isReadingMsg = false;
						}
					},
					fail: () => {
						this.getUnReadMsgCount_B()
					}
				})
			})
		},
		
		// 未读数消息长连接
		getUnReadMsgCount() {
			return new Promise(() => {
				app.data.isReadingMsg = true;
				wx.request({
					url: app.data.baseUrl + '/wxa/msg-long-polling.htm',
					method: 'POST',
					header: {
						'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
						'content-type': 'application/x-www-form-urlencoded'
					},
					success: res => {
						if (res.statusCode === 200) {
							const datas = res.data;
							if (datas.success) {
								app.data.hasUnReadMsg = true;
								app.data.isReadingMsg = false;
								const pages = getCurrentPages();
								const curPage = pages[pages.length - 1];
								const curRoute = curPage.route;
								const pushBox = curPage.selectComponent('#pushBox');
								let logo = datas.data.logo;
								if(logo){
									if(logo.indexOf('http') === -1){
										logo = this.data.baseUrl + logo
									}
								}else{
									logo = this.data.defaultHead
								}
								datas.data.logo = logo;
								pushBox.setData({
									pushData: datas.data
								})
								clearTimeout(timer);
								pushBox.showPush();
								if(curRoute === 'pages/index/index' || curRoute === 'pages/personOwen/personOwen' || curRoute === 'pages/shoppCar/shoppCar' || curRoute === 'pages/allGoods/allGoods'){
									wx.showTabBarRedDot({index: 0});
									wx.showTabBarRedDot({index: 1});
									wx.showTabBarRedDot({index: 2});
									wx.showTabBarRedDot({index: 3});
									curPage.setData({
										point: true
									})
								}
								timer = setTimeout(() => {
									pushBox.hidePush()
								}, 5000);
								this.getUnReadMsgCount()
							} else {
								// util.showToast(datas.msg);
								app.data.isReadingMsg = false;
							}
						} else {
							util.showToast(res.errMsg);
							app.data.isReadingMsg = false;
						}
					},
					fail: () => {
						this.getUnReadMsgCount()
					}
				})
			})
		},
		
	}
})
