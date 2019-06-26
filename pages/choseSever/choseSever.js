const app = getApp();
import util from '../../utils/util';
let from = '';
Page({
    data: {
        defaultHead: app.data.defaultHead,
		baseUrl: app.data.baseUrl,
        serverArry: [],
		couponData: {
			show: false,
			name: '',
			price: 0
		}
    },

    onLoad(opts) {
        from = opts.from ? opts.from : '';
        util.showLoading();
        app.api.getImList().then(res => {
            if(res.success){
                wx.hideLoading();
                this.setData({
                    serverArry: res.data
                })
            }else{
                util.showToast(res.msg)
            }
        })
    },

    choseSever(e){
        util.showLoading();
        const dataset = e.currentTarget.dataset;
        if(from === 'set'){
            if(dataset.id === wx.getStorageSync('im').id){
                util.navBack(1)
            }else{
                app.api.changeUser(dataset.id).then(res => {
                    if(res.success){
                        wx.setStorageSync('im', dataset);
                        util.showToast('更换成功', 'success');
                        setTimeout(() => {
                            const pages = getCurrentPages();
                            const setPage = pages[pages.length - 2];
                            setPage.setData({
                                'navList[1][1].value': dataset.name
                            })
                            util.navBack(1)
                        }, 1000)
                    }else{
                        util.showToast(res.msg)
                    }
                })
            }
        }else{
        	wx.login({
				success: res => {
					app.api.register({
						userId: dataset.id,
						source: 3,
						nickName: app.data.userInfo.nickName,
						avatarUrl: app.data.userInfo.avatarUrl,
						wxacode: res.code
					}).then(res => {
						if(res.success){
							wx.setStorageSync('im', dataset);
							wx.setStorageSync('isLogin', 'customer');
							app.data.isLogin = 'customer';
							wx.hideLoading();
							const datas = res.data;
							if(datas.recommendPrize){
								this.setData({
									couponData: {
										show: true,
										price: datas.prizePrice,
										name: app.data.userInfo.nickName
									}
								})
							}else{
								util.tabTo('allGoods/allGoods')
							}
						}else{
							util.showToast(res.msg)
						}
					})
				}
			})
        
        }
    },
	
	cha(){
    	util.tabTo('allGoods/allGoods')
	}
})