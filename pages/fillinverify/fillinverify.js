import util from '../../utils/util';
const app = getApp();
let timer = null, newTimer = null;

Page({
    data: {
        Length: 6,
        isFocus: true,
        value: '',
        phone: '',
        phoneStar: '',
        time: 60
    },

    onLoad(opts){
        this.setData({
            phone: opts.phone,
            phoneStar: opts.phone.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2')
        })
        if(opts.type === 'phone'){
            timer = null;
            this.goTime(timer)
        }
        if(opts.type === 'newPhone'){
            newTimer = null;
            this.goTime(newTimer)
        }
    },

    goTime(timer){
        timer = setInterval(() => {
            if(this.data.time === 0) {
                clearInterval(timer);
                return
            }
            this.setData({
                time: this.data.time - 1
            })
        }, 1000)
    },

    onUnload(){
        if(this.options.type === 'phone'){
            if(timer) clearInterval(timer)
        }else if(this.options.type === 'newPhone'){
            if(newTimer) clearInterval(newTimer)
        }
    },

    // 输入
    bindinput(e){
        const value = e.detail.value;
        this.setData({
            value: value
        }, () => {
            if(value.length === 6) this.validate(value)
        })
    },

    // 聚焦
    tap(){
        this.setData({
            isFocus: true
        })
    },

    // 判断验证码
    validate(value){
        util.showLoading();
        const phone = this.data.phone;
        app.api.checkVcode(value).then(res => {
            if(res.success){
                if(this.options.type === 'phone'){
                    wx.hideLoading();
                    util.navTo('getverify/getverify?type=newPhone')
                }else if(this.options.type === 'newPhone'){
                    app.api.setPhone(phone).then(res1 => {
                        if(res1.success){
                            util.showToast('换绑成功', 'success');
                            setTimeout(() => {
                                const pages = getCurrentPages();
                                const setPage = pages[pages.length - 5];
                                setPage.setData({
                                    'navList[1][0].value': phone
                                }, () => {
                                    util.navBack(4)
                                })
                            }, 1000)
                        }else{
                            util.showToast(res1.msg)
                        }
                    })
                }
            }else{
                util.showToast(res.msg)
            }
        })
    },

    reGet(){
        if(this.data.time) return;
        app.api.sendVcode(this.data.phone).then(res => {
            if(res.success){
                util.showToast('发送成功', 'success');
                this.setData({
                    isFocus: true,
                    time: 60
                }, () => {
                    if(this.options.type === 'phone'){
                        this.goTime(timer)
                    }else if(this.options.type === 'newPhone'){
                        this.goTime(newTimer)
                    }
                })
            }else{
                util.showToast(res.msg)
            }
        })
    }
})