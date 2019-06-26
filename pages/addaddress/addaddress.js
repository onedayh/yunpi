const app = getApp();
import util from '../../utils/util';
const regTel = /^[1][3-9][0-9]{9}$/;
let province = '', city = '', region = '', id = '';
Page({
    data: {
        name: '',
        phone: '',
        area: '请选择',
        address: '',
        count: 0,
        value: []
    },

    onLoad(){
        id = '';
        province = '';
        city = '';
        region = '';
        if(wx.getStorageSync('curAddress')){
            const cur = JSON.parse(wx.getStorageSync('curAddress'));
            id = cur.addressId;
            province = cur.detailedProvince;
            city = cur.detailedCity;
            region = cur.detailedDistrict;
            util.setTitle('编辑地址');
            this.setData({
                address: cur.detailedAddress,
                name: cur.logisticsName,
                phone: cur.mobilePhone,
                area: `${province} ${city} ${region}`,
                value: [province, city, region]
            })
        }
        this.setData({
            count: this.data.address.length
        })
    },

    // 输入收货人
    handleName(e){
        this.setData({
            name: e.detail.value
        })
    },

    // 输入手机号
    handlePhone(e){
        const phone = e.detail.value;
        if(phone.length !== 11) return;
        this.setData({
            phone: phone
        })
    },

    // 选择区域
    handleChange(e){
        const value = e.detail.value;
        province = value[0];
        city = value[1];
        region = value[2];
        this.setData({
            area: value.join(' '),
            value: value
        })
    },

    // 输入地址
    handleAddress(e){
        const value = e.detail.value;
        this.setData({
            address: value,
            count: value.length
        })
    },

    // 保存
    save(){
        const _data = this.data;
        if(!(_data.name && regTel.test(_data.phone) && _data.area !== '请选择' && _data.address)){
            util.showToast('请填写完整正确的信息');
            return
        }
        util.showLoading();
        const opts = {
            addressId: id,
            province: province,
            city: city,
            district: region,
            detailAddress: _data.address,
            logisticsName: _data.name,
            mobilePhone: _data.phone
        }
        app.api.setAddress(opts).then(res => {
            if(res.success){
                util.showToast('保存成功', 'success');
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage=pages[pages.length - 2];
                    prevPage.setData({toLoad: true}, () => {
                        util.navBack(1)
                    })
                }, 1000)
            }else{
                util.showToast(res.msg)
            }
        })
    }
})