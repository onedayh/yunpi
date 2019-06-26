const app = getApp();
import util from '../../utils/util';

Page({
    data: {
        content: [],
        baseUrl: app.data.baseUrl
    },

    onLoad(){
        this.getContent()
    },

    getContent(){
        util.showLoading();
        app.api.aboutUs().then(res => {
            if(res.success){
                if(res.data['about-us']){
                    let content = JSON.parse(res.data['about-us']);
                    content.forEach(item => {
                        if(item.type === 'text') item.text = item.text.split('<br/>')
                    })
                    this.setData({
                        content: content
                    })
                }else{
                    this.setData({
                        empty: true
                    })
                }
                wx.hideLoading()
            }else{
                util.showToast(res.msg)
            }
        })
    }
})