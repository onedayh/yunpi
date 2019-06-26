import util from '../../utils/util';
const app = getApp();

Page({

    data: {
        baseUrl: app.data.baseUrl,
        goodsListArry: [],
        page: 1,
        load: false,                // 是否加载完成
        feedback: '',               // 下拉加载反馈
        canPullDown: false,          // 能否下拉加载
		from: ''
    },

    onLoad() {
		const isLogin = wx.getStorageSync('isLogin');
		app.data.isLogin = isLogin;
        this.getColList()
    },
	onReady(){
		if(!app.data.isReadingMsg && app.data.isLogin === 'customer') this.selectComponent('#pushBox').getUnReadMsgCount();
	},

    getColList(){
        const that = this;
        util.showLoading();
        app.api.getColList({
            page: that.data.page,
            pageSize: app.data.pageSize
        }).then(res => {
            if(res.success){
                that.setData({
                    goodsListArry: res.data.list,
                    load: true,
					from: this.options.from ? this.options.from : ''
                })
                wx.hideLoading();
                that.canPull(res.data.lastPage)
            }else{
                util.showToast(res.msg)
            }
        })
    },

    // 加载完数据后的反馈
    canPull(lastPage){
        this.setData({
            canPullDown: lastPage ? false : true,
            feedback: lastPage ? '已加载全部数据' : ''
        })
    },

    // 下拉加载
    onReachBottom(){
        const that = this;
        if(!that.data.canPullDown) return;
        that.setData({
            feedback: '加载中...',
            canPullDown: false,
        })
        let page = that.data.page;
        app.api.getColList({
            page: page + 1,
            pageSize: app.data.pageSize
        }).then(res => {
            if(res.success){
                that.setData({
                    goodsListArry: [...that.data.goodsListArry, ...res.data.list],
                    page: page + 1
                })
                that.canPull(res.data.lastPage)
            }else{
                that.setData({
                    feedback: '加载失败，请重试',
                    canPullDown: true,
                })
            }
        })
    },

    // 删除收藏
    delcollect(e) {
        const that = this;
        util.showModal('提示', '确定要删除该商品吗？', res => {
            if(res.confirm){
                util.showLoading();
                const dataset = e.currentTarget.dataset;
                app.api.handleCollect(true, dataset.id).then(res => {
                    if(res.success){
                        let list = that.data.goodsListArry;
                        list.splice(dataset.index, 1);
                        that.setData({
                            goodsListArry: list
                        })
                        util.showToast('删除成功', 'success');
						wx.setStorageSync('collectData', {
							cardId: dataset.id,
							isCollect: false
						})
                    }else{
                        util.showToast(res.msg)
                    }
                })
            }
        })
    },

    goDetail(e){
        if(e.target.id === 'form') return;
        util.navTo(`goodsDetails/goodsDetails?id=${e.currentTarget.dataset.id}&type=cus`)
    },

    formbutton(e){
        util.showLoading();
        app.api.sendGoodsToIm(e.currentTarget.dataset.id).then(res => {
            if(res.success){
				app.collectFormId(e.detail.formId);
                util.navTo(`im/im`)
            }else{
                util.showToast(res.msg)
            }
        })
    },
	
	goIndex(e){
		app.collectFormId(e.detail.formId);
		util.tabTo(`index/index`);
	},
})