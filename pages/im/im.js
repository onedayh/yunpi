import webim from '../../IM/webim_wx';
import webimhandler from '../../IM/webim_handler';
import util from '../../utils/util';
const app = getApp();
const defaultHead = app.data.defaultHead;
let loginInfo = null,					// 登录im信息
 	selType = webim.SESSION_TYPE.C2C,	// 聊天类型 单聊
  	handleHistory = false,				// 是否下拉加载过聊天记录
   	num = 0,							// 记录每条消息
    pageSize = 0,						// 消息总条数
    allLoad = false,
    isScroll = false,
    timer = null;

Page({
    data: {
        from: '',

        load: false,		// 下拉加载
        toview: '',			// scroll-view 指定滚动到的id
        scrollHeight: 0,

        baseUrl: app.data.baseUrl,
        currentMsgsArray: [],	// 消息数组
        text_content: '',		// 输入框内容

        animationData: {},
        animationData1: {},
        showEmoji: false,   // 是否显示表情

        spacing: 10,        // 光标与键盘的距离

        reqMsgCount: 10,	// 一次加载消息数量
        userInfo: {},       // 用户信息
        imInfo: {},         // 客服信息

        lookData: [
            "☺-😋-😌-😍-😏-😜-😝-😞-😔-😪-😭-😁-😂-😃-😅-😆-👿-😒-😓-😔-😏-😖-😘-😚-😒-😡-😢-😣-😤-😢-😨-😳-😵-😷-😸-😻-😼-😽-😾-😿-🙊-🙋-🙏-✈-🚇-🚃-🚌-🍄-🍅-🍆-🍇-🍈-🍉-🍑-🍒-🍓-🐔-🐶-🐷-👦-👧-👱-👩-👰-👨-👲-👳-💃-💄-💅-💆-💇-🌹-💑-💓-💘-🚲"
        ],
        lookWidth: 0,
        lookValue: 0,
        lookList: ['☺']
    },

    onLoad(opts){
        num = 0;
        handleHistory = false;
        allLoad = false;
        pageSize = 0;
        timer = null;
        isScroll = false;
        // 获取手机width, height
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
		this.setData({isLogin: isLogin});
		if(isLogin === 'customer'){
			app.api.getuserStatus(true);
		}else if(isLogin === 'user'){
			app.api.getuserStatus_B(true);
		}
        wx.getSystemInfo({
            success: res => {
                let lookData = this.data.lookData, newLook = [];
                lookData.forEach(item => {
                    newLook.push(item.split('-'))
                })
                this.setData({
                    from: opts.from || '',
                    lookData: newLook,
                    scrollHeight: res.windowHeight - 100 * (res.windowWidth / res.windowHeight),
                    lookWidth: this.data.lookList.length * 80 + 120
                })
            }
        })
    },

    onReady(){
        util.showLoading();
        this.init();
		if(!app.data.isReadingMsg && app.data.isLogin === 'customer') this.selectComponent('#pushBox').getUnReadMsgCount();
		if(!app.data.isReadingMsg && app.data.isLogin === 'user') this.selectComponent('#pushBox').getUnReadMsgCount_B();
    },
	
	onShow(){
    	if(app.data.isPreview) app.data.isPreview = false
	},

    // 初始化IM
    init(){
        const that = this;
		that.getApi().then(res => {
            loginInfo = res;
            const listener = {
                "onConnNotify": that.onConnNotify,   //监听连接状态回调变化事件,必填
                "onMsgNotify": that.onMsgNotify      //监听新消息(私聊，普通群(非直播聊天室)消息，全员推送消息)事件，必填
            };
            const options = {};
            webim.login(loginInfo, listener, options, resp => {
				app.data.hasUnReadMsg = false;
                loginInfo.identifierNick = resp.identifierNick; //设置当前用户昵称
                that.getUserInfo();
                that.getHistory();
            }, () => {
                util.showToast('登录失败')
            })
        }).catch(err => {
            util.showToast(err)
        })
    },
	
	getApi(){
    	const isLogin = app.data.isLogin;
    	let api = null;
    	if(isLogin === 'user'){
			api = this.getImLoginInfo_B()
		}else if(isLogin === 'customer'){
    		api = this.getImLoginInfo()
		}
		return api
	},
	
	// 获取商家端im登录配置
	getImLoginInfo_B(){
    	const toAccount = this.options.toAccount;
		let p = new Promise((resolve, reject) => {
			app.api.getImLoginInfo_B(toAccount).then(res => {
				if(res.success){
					const datas = res.data;
					const loginInfo = {
						'sdkAppID': datas.sdkAppID,             // 用户标识接入SDK的应用ID，必填。
						'appIDAt3rd': datas.sdkAppID,           // 用户使用OAuth授权体系分配的Appid，必填
						'identifier': datas.imAccount,          // 用户帐号，必填
						'identifierNick': datas.userName,       // 用户昵称，选填
						'accountType': datas.accountType,       // 账号类型，必填
						'userSig': datas.sig,                   // 鉴权Token，必填
						'toAccount': toAccount     				// 客服账户
					}
					this.setData({
						imInfo: {
							name: datas.customerInfo.name,
							head: datas.customerInfo.logoUrl ? datas.customerInfo.logoUrl.indexOf('http') > -1 ? datas.customerInfo.logoUrl : this.data.baseUrl + datas.customerInfo.logoUrl : defaultHead,
							userPhone: datas.customerInfo.phoneNumber,
							customerId: datas.customerInfo.customerId
						}
					})
					util.setTitle(datas.customerInfo.name);
					resolve(loginInfo)
				}else{
					reject(res.msg)
				}
			})
		})
		return p
	},

    // 获取用户端im登录配置
    getImLoginInfo(){
        let p = new Promise((resolve, reject) => {
            app.api.getImLoginInfo().then(res => {
                if(res.success){
                    const datas = res.data;
                    const loginInfo = {
                        'sdkAppID': datas.sdkAppID,             // 用户标识接入SDK的应用ID，必填。
                        'appIDAt3rd': datas.sdkAppID,           // 用户使用OAuth授权体系分配的Appid，必填
                        'identifier': datas.imAccount,          // 用户帐号，必填
                        'identifierNick': datas.userName,       // 用户昵称，选填
                        'accountType': datas.accountType,       // 账号类型，必填
                        'userSig': datas.sig,                   // 鉴权Token，必填
						'toAccount': datas.toAccount,            // 客服账户
						'phoneNumber': datas.phoneMobile,
						'wechat': datas.wechat
                    }
                    resolve(loginInfo)
                }else{
                    reject(res.msg)
                }
            })
        })
        return p
    },

    // 监听连接状态回调变化事件
    onConnNotify(resp){
        let info;
        switch (resp.ErrorCode) {   // 链接状态码
            case webim.CONNECTION_STATUS.ON:
                webim.Log.warn('建立连接成功: ' + resp.ErrorInfo);
                break;
            case webim.CONNECTION_STATUS.OFF:
                info = '连接已断开，无法收到新消息，请检查下您的网络是否正常: ' + resp.ErrorInfo;
                webim.Log.warn(info);
                break;
            case webim.CONNECTION_STATUS.RECONNECT:
                info = '连接状态恢复正常: ' + resp.ErrorInfo;
                webim.Log.warn(info);
                break;
            default:
                webim.Log.error('未知连接状态: =' + resp.ErrorInfo); // 错误信息
                break;
        }
    },

    // 获取历史消息
    getHistory(){
        const that = this;
        const options = {
            'Peer_Account': loginInfo.toAccount,        // 指定的好友帐号
            'MaxCnt': that.data.reqMsgCount,            // 拉取的消息数目
            'LastMsgTime': handleHistory ? wx.getStorageSync('lastMsgTime') : 0, // 上一次拉取的时间  在第一次拉去消息的时候，这里必须为0
            'MsgKey': handleHistory ? wx.getStorageSync('msgKey') : ''
        }
        let selSess = null;
        webim.getC2CHistoryMsgs(
            options,
            resp => {
                let complete = resp.Complete;       // 是否还有历史消息可以拉取，1-表示没有，0-表示有
                if(resp.MsgList.length === 0){
                    this.setData({
                        load: false
                    })
                    wx.hideLoading();
                    allLoad = true;
                    return;
                }
                // 拉取消息后，要将下一次拉取信息所需要的东西给存在缓存中
                wx.setStorageSync('lastMsgTime', resp.LastMsgTime);
                wx.setStorageSync('msgKey', resp.MsgKey);
                let msgList = handleHistory ? resp.MsgList.reverse() : resp.MsgList;
                pageSize = handleHistory ?  pageSize + msgList.length : msgList.length;
                for (let j in msgList) { //遍历新消息
                    let msg = msgList[j];
                    if (msg.getSession().id() == loginInfo.toAccount) { // 为当前聊天对象的消息
                        selSess = msg.getSession();
                        //在聊天窗体中新增一条消息
                        that.addMsg(msg)
                    }
                }
                // 消息已读上报，并将当前会话的消息设置成自动已读
                webim.setAutoRead(selSess, true, true);
            }
        )
    },

    // 处理消息
    addMsg(msg){
        const that = this;
        let fromAccount, fromAccountNick, sessType, subType;
        fromAccount = msg.getFromAccount();
        if (!fromAccount) fromAccount = '';
        fromAccountNick = msg.getFromAccountNick();
        if (!fromAccountNick) fromAccountNick = fromAccount;
        //解析消息
        //获取会话类型
        //webim.SESSION_TYPE.GROUP-群聊，
        //webim.SESSION_TYPE.C2C-私聊，
        sessType = msg.getSession().type();
        //获取消息子类型
        //会话类型为群聊时，子类型为：webim.GROUP_MSG_SUB_TYPE
        //会话类型为私聊时，子类型为：webim.C2C_MSG_SUB_TYPE
        subType = msg.getSubType();
        switch (sessType) {
            case webim.SESSION_TYPE.C2C: //私聊消息
                switch (subType) {
                    case webim.C2C_MSG_SUB_TYPE.COMMON: //c2c普通消息
                        //业务可以根据发送者帐号fromAccount是否为app管理员帐号，来判断c2c消息是否为全员推送消息，还是普通好友消息
                        //或者业务在发送全员推送消息时，发送自定义类型(webim.MSG_ELEMENT_TYPE.CUSTOM,即TIMCustomElem)的消息，在里面增加一个字段来标识消息是否为推送消息
                        that.convertMsg(msg);//解析方法
                        break;
                }
                break;
        }
    },

    convertMsg(msg){
        let currentMsg = {}, //设置消息数组，存消息
            currentMsgsArray = this.data.currentMsgsArray,
            msgContent = webimhandler.convertMsgtoHtml(msg);
        if(msgContent.indexOf('data=') > -1 && msgContent.indexOf('desc=') > -1 && msgContent.indexOf('ext=') > -1){
        	currentMsg.msgData = this.customIm(msgContent);
        }else if(msgContent.indexOf('src=') > -1 && msgContent.indexOf('bigImgUrl=') > -1){
            currentMsg.msgImg = this.convertImg(msgContent);
        }else{
            currentMsg.msgContent = msgContent;
        }
        currentMsg.timeStamp = Math.round(msg.getTime());
        currentMsg.msgTime = this.getMsgTime(msg);
        currentMsg.isSelfSend = msg.getIsSend();
        num ++;
        currentMsg.id = 'chat' + num;
        wx.hideLoading();
        if(handleHistory){
            // 加载历史消息
            currentMsgsArray.unshift(currentMsg);
            if(pageSize === currentMsgsArray.length){
                this.setData({
                    currentMsgsArray: this.handleTime(currentMsgsArray),
                }, () => {
                    setTimeout(() => {
                        this.setData({
                            load: false
                        })
                    }, 200)
                })
            }
        }else{
            // 获取当前消息
            currentMsgsArray.push(currentMsg);
            if(pageSize === currentMsgsArray.length){
                this.setData({
                    currentMsgsArray: this.handleTime(currentMsgsArray)
                }, () => {
                    setTimeout(() => {
                        this.setData({
                            toview: 'chat',
                        })
                    }, 200)
                })
            }
        }
    },

    customIm(msgContent){
        let arr = msgContent.split(', desc=');
        let arr1 = arr[1].split(', ext=');
        let data = arr[0].slice(5) ? JSON.parse(arr[0].slice(5)) : {};
        if(data.type === 1){
            let snapShot = data.snapShot, newS = [];
            if(snapShot[0].details.length >= 2){
                snapShot[0].details = snapShot[0].details.slice(0, 2);
                newS = [snapShot[0]]
            }else if(snapShot.length === 1){
                newS = snapShot
            }else{
                snapShot[1].details = snapShot[0].details.slice(0, 1);
                snapShot = snapShot.slice(0, 2);
                newS = snapShot
            }
            data.snapShot = newS
        }
        return {
            data: data,
            desc: arr1[0],
            ext: arr1[1]
        }
    },

    convertImg(msgContent){
        let smallStr = msgContent.split("src='")[1];
        let bigStr = msgContent.split("bigImgUrl='")[1];
        let smallUrl = smallStr.slice(0, smallStr.indexOf("'")).split('#')[0];
        let bigUrl = bigStr.slice(0, bigStr.indexOf("'"));
        return {
            smallUrl: smallUrl,
            bigUrl: bigUrl
        }
    },

    // 发消息
    sendMsg(){
        const that = this, text_content = that.data.text_content;
        let selSess = new webim.Session(selType, loginInfo.toAccount);
        let isSend = true;      //是否为自己发送
        let seq = -1;           //消息序列，-1表示 SDK 自动生成，用于去重
        let random = Math.round(Math.random() * 4294967296);        //消息随机数，用于去重
        let msgTime = Math.round(new Date().getTime() / 1000);      //消息时间戳
        let subType; //消息子类型
        if (selType == webim.SESSION_TYPE.C2C) {
            subType = webim.C2C_MSG_SUB_TYPE.COMMON;
        }
        let msg = new webim.Msg(selSess, isSend, seq, random, msgTime, loginInfo.identifier, subType, loginInfo.identifierNick);
        let text_obj, face_obj, tmsg, emotionIndex, emotion, restMsgIndex;
        //解析文本和表情
        let expr = /\[[^[\]]{1,3}\]/mg;
        let emotions = text_content.match(expr);

        if (!emotions) {
            text_obj = new webim.Msg.Elem.Text(text_content);
            msg.addText(text_obj);
        }

        webim.sendMsg(msg, resp => {
            if (selType == webim.SESSION_TYPE.C2C) {
                pageSize ++;
                that.addMsg(msg);//这个方法上面有
            }
        }, err => {
            console.log(err.ErrorInfo);
        })
    },

    //监听新消息事件     注：其中参数 newMsgList 为 webim.Msg 数组，即 [webim.Msg]。
    //newMsgList 为新消息数组，结构为[Msg]
    onMsgNotify(newMsgList) {
        let sess, newMsg, selSess;
        //获取所有聊天会话
        let sessMap = webim.MsgStore.sessMap();
        for (var j in newMsgList) {     //遍历新消息
            newMsg = newMsgList[j];
            if (newMsg.getSession().id() == loginInfo.toAccount) {      //为当前聊天对象的消息
                selSess = newMsg.getSession();
                //在聊天窗体中新增一条消息
                pageSize ++;
                this.addMsg(newMsg);
            }
        }
        //消息已读上报，以及设置会话自动已读标记
        webim.setAutoRead(selSess, true, true);
        for (var i in sessMap) {
            sess = sessMap[i]
        }
    },

    // 获取信息
    getUserInfo(){
    	const isLogin = app.data.isLogin;
    	if(isLogin === 'customer'){
			app.api.getUserInfo().then(res => {
				if(res.success){
					let datas = res.data[0];
					util.setTitle(datas.userName);      // 客服名称
					let im = wx.getStorageSync('im');
					this.setData({
						userInfo: {
							name: datas.name,
							head: datas.logoUrl ? datas.logoUrl.indexOf('http') > -1 ? datas.logoUrl : app.data.baseUrl + datas.logoUrl : defaultHead
						},
						imInfo: {
							...im,
							head: im.head ? im.head.indexOf('http') > -1 ? im.head : app.data.baseUrl + im.head : defaultHead
						}
					})
				}else{
					util.showToast(res.msg)
				}
			})
		}else if(isLogin === 'user'){
    		app.api.getInfo_B().then(res => {
    			if(res.success){
    				const datas = res.data;
    				this.setData({
						userInfo: {
							name: datas.nickName,
							head: datas.logoPath ? datas.logoPath.indexOf('http') > -1 ? datas.logoPath : app.data.baseUrl + datas.logoPath : defaultHead
						}
					})
				}else{
					util.showToast(res.msg)
				}
			})
		}
    },

    // 输入内容
    bindinput(e){
        this.setData({
            text_content: e.detail.value
        })
    },

    // 发送消息
    send(e){
        if((e.type === 'confirm' || e.currentTarget.dataset.type === 'confirm') && this.data.text_content){
            handleHistory = false;
            this.sendMsg();
        }else{
            util.showToast('请勿发送空白消息');
        }
        this.setData({
            text_content: ''
        })
    },

    // 获取消息时间
    getMsgTime(msg){
        const msgTime = msg.getTime();  //得到当前消息发送的时间
        const timeStamp = new Date(new Date().setHours(0, 0, 0, 0)) / 1000; //得到当天凌晨的时间戳
        let thisdate = util.getLocalTime({data: msgTime});
        if (timeStamp < msgTime) {
            thisdate = thisdate.substr(6)
        }
        return thisdate
    },

    // 显示表情
    openEmoji(){
        setTimeout(() => {
            let animation = wx.createAnimation({
                duration: 500,
                timingFunction: 'ease',
            })
            this.animation = animation;
            animation.bottom(0 + 'rpx').step();
            this.setData({
                animationData:animation.export(),
                showEmoji: true,
                toview: 'chat'
            })
        }, 500)
    },

    // 隐藏表情
    hideEmoji(){
        let animation = wx.createAnimation({
            duration: 500,
            timingFunction: 'ease',
        })
        this.animation = animation;
        animation.bottom(-500 + 'rpx').step();
        this.setData({
            animationData:animation.export(),
            showEmoji: false
        })
    },

    // 输入框失焦
    bindblur(){
        this.hideEmoji()
    },

    // 发送图片
    sendImg(){
        const currentMsgsArray = this.data.currentMsgsArray;
		app.data.isPreview = true;
        wx.chooseImage({
            count: 1,
            success: res => {
				app.data.isPreview = false;
                this.setData({
                    currentMsgsArray: [
                        ...currentMsgsArray,
                        {
                            isSelfSend: true,
                            msgImg: {
                                smallUrl: '../../img/loadpic.png'
                            },
                            msgTime: '',
                            timeStamp: ''
                        }
                    ]
                }, () => {
                    setTimeout(() => {
                        this.setData({
                            toview: 'chat'
                        })
                    }, 100)
                })
				let formdata = {}, url = '';
                const {isLogin} = this.data;
                if(isLogin === 'customer'){
					url = '/wxa/im/send-image.htm';
				}else if(isLogin === 'user'){
    				url = '/wxab/im/send-image.htm';
					formdata = {
						toAccount: this.options.toAccount
					}
				}
                wx.uploadFile({
                    url: app.data.baseUrl + url,
                    filePath: res.tempFilePaths[0],
                    name: 'imgFile',
                    header: {
                        'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
                        'content-type': 'multipart/form-data'
                    },
					formData: formdata,
                    success: res1 => {
                        let datas = JSON.parse(res1.data);
                        if(datas.success){
                            this.setData({
                                currentMsgsArray: currentMsgsArray
                            })
                        }else{
                            util.showToast(datas.msg);
                            this.setData({
                                currentMsgsArray: currentMsgsArray
                            })
                        }
                    },
                    fail: () => {
                        util.showToast('发送图片失败');
                        this.setData({
                            currentMsgsArray: currentMsgsArray
                        })
                    }
                })
            },
			fail: () => {
				app.data.isPreview = false;
			}
        })
    },

    // 预览图片
    preImg(e){
		app.data.isPreview = true;
        const bigurl = e.currentTarget.dataset.bigurl;
        if(bigurl){
            wx.previewImage({
                urls: [bigurl],
                complete: res => {
                    console.log(res)
                }
            })
        }
    },

    // 下拉加载历史消息
    bindscrolltoupper(){
        if(this.data.load || allLoad) return;
        this.setData({
            load: true
        })
        handleHistory = true;
        this.getHistory()
    },

    useEmoji(e){
        this.setData({
            text_content: this.data.text_content + e.currentTarget.dataset.content
        })
    },

	// 商品页面
	goGoods(e){
    	let type = app.data.isLogin === 'customer' ? 'cus' : 'cardin';
		util.navTo(`goodsDetails/goodsDetails?id=${e.currentTarget.dataset.goodid}&from=im&type=${type}`)
	},

	// 订单详情页
	goOrder(e){
		util.navTo(`orderDetails/orderDetails?id=${e.currentTarget.dataset.orderid}&from=im`)
	},

    // 时间处理
    handleTime(currentMsgsArray){
        currentMsgsArray.forEach((item, index, arr) => {
            if(index > 0 && item.timeStamp - arr[index - 1].timeStamp < 3600){
                item.msgTime = ''
            }
        })
        return currentMsgsArray
    },

    onUnload(){
        webim.logout(() => {
            loginInfo = null;
            if(timer) clearTimeout(timer);
        });
    },

    // 选择表情
    chooseLook(e){
        const value = e.currentTarget.dataset.value;
        if(value === this.data.lookValue) return;
        this.setData({
            lookValue: value
        })
    },

    // 页面滚动
    bindscroll(){
        this.hideIndex();
        if(timer) clearTimeout(timer);
        timer = setTimeout(() => {
            this.showIndex()
        }, 500)
    },

    // 显示首页入口
    showIndex(){
        let animation = wx.createAnimation({
            duration: 200
        });
        this.animation = animation;
        animation.left(20 + 'rpx').step();
        this.setData({
            animationData1: animation.export()
        })
        isScroll = false
    },

    // 隐藏首页入口
    hideIndex(){
        if(isScroll) return;
        isScroll = true;
        let animation = wx.createAnimation({
            duration: 200
        });
        this.animation = animation;
        animation.left(-100 + 'rpx').step();
        this.setData({
            animationData1: animation.export()
        })
    },

    goIndex(e){
		app.collectFormId(e.detail.formId);
		util.tabTo(`index/index`);
    },
	
	toall(){
    	if(app.data.isLogin === 'customer') util.tabTo(`allGoods/allGoods`)
	},
	
	totro(){
		if(app.data.isLogin === 'customer') util.navTo(`aboutus/aboutus`)
	},
	
	call(){
		if(app.data.isLogin === 'customer'){
			wx.makePhoneCall({
				phoneNumber: loginInfo.phoneNumber
			})
		}
	},
	
	call2(){
		wx.makePhoneCall({
			phoneNumber: this.data.imInfo.userPhone
		})
	},
	
	goCus(e){
    	util.navTo(`customer/customer?from=im&id=${this.data.imInfo.customerId}&actab=${e.currentTarget.id}`)
	},
	
	addwx(){
    	if(app.data.isLogin === 'customer'){
			const wx = loginInfo.wechat;
			if(wx){
				wx.setClipboardData({
					data: wx.toString(),
					success: res => {
						if (res.errMsg === 'setClipboardData:ok') {
							util.showToast('微信号已复制，请到微信添加');
						}
					}
				})
			}else{
				util.showToast('抱歉，客服没有留下微信号')
			}
		}
	},
	
	sendGood(){
    	util.navTo(`sendGood/sendGood?toAccount=${this.options.toAccount}`)
	}
})