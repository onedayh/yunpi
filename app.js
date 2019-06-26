//app.js
import util from './utils/util';
import api from './utils/api.js';

App({
    onLaunch() {
		
    },
	
    // 小程序启动，或从后台进入前台显示时
    onShow() {
        if (this.data.isLogin && !this.data.isPreview){
        	this.data.isHide = false;
        	if(this.data.isLogin === 'customer'){
				this.api.getuserStatus(true);
			}else{
				this.api.getuserStatus_B(true);
			}
		}
    },
    // 小程序从前台进入后台时
    onHide() {
    	const {isLogin, isPreview, formIds} = this.data;
        if (isLogin){
			if(!isPreview){
				this.data.isHide = true;
				if(this.data.isLogin === 'customer'){
					this.api.getuserStatus(false);
				}else{
					this.api.getuserStatus_B(false);
				}
			}
			if(formIds.length > 0){
				if(this.data.isLogin === 'customer'){
					this.api.collectFormId(formIds.join(','));
				}else{
					this.api.collectFormId_B(formIds.join(','));
				}
				this.data.formIds = [];
			}
		}
    },
    api: new api(),
    data: {
        /*
        * sass test
        */
        baseUrl: 'https://ceshi.shushangyun.com',
        appId: 'wx8b91b65f1d7ad8e5',

        /*
        * sass master
        */
        // baseUrl: 'https://www.iyunpi.cn',
        // appId: 'wxeb71fe26535919dc',

        /*
        * 7icon test
        */
        // baseUrl: 'https://special.shushangyun.com',
        // appId: 'wx9e8a794cfbd2e050',

        /*
        * 7icon master
        */
        // baseUrl: 'https://sevenicon.taranada.cn',
        // appId: 'wx940258af4160d511',

        pageSize: 20,   							// 一页条数
        defaultHead: '/img/default-head.png',  		// 默认头像
        shopcar: [],     							// 购物车数据
        isLogin: null,       						// 用户是否登陆
        hasUnReadMsg: false,       					// 是否有未读消息
        isReadingMsg: false,       					// 是否读取消息中
		isHide: false,								// 判断小程序是否进入后台运行
		isPreview: false,							// 是否查看大图
	
		userInfo: null,
		formIds: [],								// 收集formId
		
		msgToIndex: false,							// b端消息tabbar点击客户列表操作
		
		waitPayOrder: false,						// 待付款订单
		waitSendOrder: false,						// 待发货订单
		reward: 0,									// 推荐有奖总金额
		prizePrice: 0,								// 推荐有奖金额
		customerId: null,
		
		isPublish: false
	},

    // 获取sessionid
    getSessionId() {
        const that = this;
        // let extObj = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
        // this.data.appId = extObj.appId;
        const p = new Promise((resolve, reject) => {
            wx.request({
                url: that.data.baseUrl + '/wxa/get-session.htm',
                method: 'POST',
                data: {
                    appId: that.data.appId
                },
                header: {
                    'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
                    'content-type': 'application/x-www-form-urlencoded'
                },
                success: res => {
                	if(res.data.success){
						wx.setStorageSync('sessionid', res.data.data);
						that.data.sessionId = res.data.data;
						resolve();
					}else{
						reject(res.data.msg);
					}
                },
                fail: () => {
                    reject('获取session失败');
                }
            })
        })
        return p
    },
	
	// 切换tab红点 c端
    toggleRedHot() {
		if (this.data.hasUnReadMsg) {
            wx.showTabBarRedDot({index: 0});
            wx.showTabBarRedDot({index: 1});
            wx.showTabBarRedDot({index: 2});
            wx.showTabBarRedDot({index: 3});
        } else {
            wx.hideTabBarRedDot({index: 0});
            wx.hideTabBarRedDot({index: 1});
            wx.hideTabBarRedDot({index: 2});
            wx.hideTabBarRedDot({index: 3});
        }
    },
	
	// 切换tab红点 b端
	toggleRedHot_B() {
		if (this.data.hasUnReadMsg) {
			wx.showTabBarRedDot({index: 2});
		} else {
			wx.hideTabBarRedDot({index: 2});
		}
	},
	
	// 收集formId
	collectFormId(formId){
    	let {isLogin, formIds} = this.data;
		formIds.push(formId);
    	if(formIds.length >= 10){
			formIds = formIds.join(',');
    		if(isLogin === 'user'){
    			this.api.collectFormId_B(formIds)
			}else if(isLogin === 'customer'){
				this.api.collectFormId(formIds)
			}
			formIds = []
		}
		this.data.formIds = formIds;
	},
	
	// 处理canvas图片
	changeImg(url){
		return new Promise(resolve => {
			if(url){
				url = url.indexOf('http') > -1 ? url : this.data.baseUrl + url;
				wx.getImageInfo({
					src: url,
					success: res => {
						resolve(res.path)
					}
				})
			}else{
				resolve(this.data.defaultHead)
			}
		})
	},
	
	// 判断是否开通微信支付
	checkWxpay(){
		return new Promise((resolve, reject) => {
			this.api.checkWxpay().then(res => {
				if(res.success){
					resolve(res.data.wxpay)
				}else{
					reject(res.msg)
				}
			})
		})
	}
})