import util from '../../utils/util';
const app = getApp();

Page({

    data: {
        baseUrl: app.data.baseUrl,
        historyList: [],
        page: 1,
        load: false,                // 是否加载完成
        feedback: '',               // 下拉加载反馈
        canPullDown: false          // 能否下拉加载
    },

    onLoad() {
        this.getHistory()
    },

    getHistory(){
        const that = this;
        util.showLoading();
        app.api.getHistory({
            page: that.data.page,
            pageSize: app.data.pageSize
        }).then(res => {
            if(res.success){
                that.setData({
                    historyList: res.data.list,
                    load: true
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
        app.api.getHistory({
            page: page + 1,
            pageSize: app.data.pageSize
        }).then(res => {
            that.setData({
                historyList: [...that.data.historyList, ...res.data.list],
                page: page + 1
            })
            that.canPull(res.data.lastPage)
        })
    },

    goDetail(e){
        util.navTo(`goodsDetails/goodsDetails?id=${e.currentTarget.dataset.id}&type=cus`)
    }
})