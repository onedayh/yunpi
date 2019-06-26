import util from '../../utils/util';
const app = getApp();

Page({
	data: {
		scrollHeight: 0,
		addressList: [],
		load: false,
		addressId: '',
		from: '',
        toLoad: false
	},

	onLoad(e) {
		if (e && e.from) {
			this.setData({
				from: e.from
			})
		}
		this.getAddressList()
	},

	onShow() {
	    if(this.data.toLoad){
            this.getAddressList();
            this.setData({
                toLoad: false
            })
        }
		wx.removeStorageSync('curAddress');
	},
	selectAddress(e) {
		if (!this.data.from) return;
		const index = e.currentTarget.dataset.index;
		var pages = getCurrentPages();
		var prevPage = pages[pages.length - 2];  //上一个页面
		//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
		prevPage.setData({
			address: this.data.addressList[index]
		}, () => {
			wx.navigateBack()
		})
	},
	// 获取地址列表
	getAddressList() {
		util.showLoading();
		app.api.getAddressList().then(res => {
		    if(res.success){
                let addressId = '';
                res.data.forEach(item => {
                    if (item.defaultAddress) addressId = item.addressId
                })
                this.setData({
                    addressList: res.data,
                    load: true,
                    addressId: addressId
                })
                wx.hideLoading()
            }else{
		        util.showToast(res.msg)
            }
		})
	},

	// 设置默认地址
	setDefault(e) {
		const that = this, addressId = e.currentTarget.dataset.id;
		if (addressId === that.data.addressId) return;
        util.showLoading();
        let opts = {
            addressId: addressId,
            defaultAddress: true
        };
		app.api.setAddress(opts).then(res => {
			if (res.success) {
			    let addressList = that.data.addressList;
                addressList.forEach(item => {
                    item.defaultAddress = false;
                    if(item.addressId === addressId) item.defaultAddress = true
                })
				that.setData({
					addressId: addressId,
                    addressList: addressList
				})
				util.showToast('操作成功', 'success')
			} else {
				util.showToast(res.msg)
			}
		})
	},

    onUnload(){
        if (!this.data.from) return;
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];  //上一个页面
        let n = 0;
        this.data.addressList.forEach(item => {
            if(prevPage.data.address.addressId === item.addressId){
                n ++;
                prevPage.setData({
                    address: item
                })
            }
        })
        if(!n){
            prevPage.setData({
                address: {
                    addressId: 0
                }
            })
        }
    },

	// 编辑地址
	edit(e) {
		const that = this, dataset = e.currentTarget.dataset;
		const curAddress = that.data.addressList[dataset.index];
		wx.setStorageSync('curAddress', JSON.stringify(curAddress));
		util.navTo(`addaddress/addaddress`)
	},

	// 删除地址
	delete(e) {
		util.showModal('提示', '确定要删除该地址吗？', res => {
			if (res.confirm) {
				util.showLoading();
				const that = this, dataset = e.currentTarget.dataset;
				app.api.deleteAddress(dataset.id).then(res1 => {
					if (res1.success) {
						let addressList = that.data.addressList;
						addressList.splice(dataset.index, 1);
						that.setData({
							addressList: addressList
						})
                        util.showToast('删除成功', 'success');
						// 如果删的是默认地址，则指定当前第一个为默认地址
                        if(dataset.id === that.data.addressId && addressList.length > 0){
                            let opts = {
                                addressId: addressList[0].addressId,
                                defaultAddress: true
                            };
                            app.api.setAddress(opts).then(res2 => {
                                if (res2.success) {
                                    that.setData({
                                        addressId: addressList[0].addressId,
                                    })
                                } else {
                                    util.showToast(res2.msg)
                                }
                            })
                        }
					} else {
						util.showToast(res1.msg)
					}
				})
			}
		})
	},

	// 新增地址
	add() {
		util.navTo(`addaddress/addaddress`)
	},

	// 获取微信地址
	useWx() {
		// 获取用户授权信息
		wx.getSetting({
			success: res => {
				const auth = res.authSetting;
				if (Object.keys(auth).indexOf('scope.address') === -1 || auth['scope.address']) {
					this.chooseAddress()
				} else if (!auth['scope.address']) {
					util.showModal('提示', '你已拒绝通讯地址授权，请按确定前往新页面选中‘通讯地址’重新授权', res => {
						if (res.confirm) this.openSetting()
					})
				}
			}
		})
	},

	// 选择微信收货地址
	chooseAddress() {
		wx.chooseAddress({
			success: res => {
				const opts = {
					province: res.provinceName,
					city: res.cityName,
					district: res.countyName,
					detailAddress: res.detailInfo,
					logisticsName: res.userName,
					mobilePhone: res.telNumber
				}
				app.api.setAddress(opts).then(res1 => {
					if (res1.success) {
                        this.getAddressList();
					} else {
						util.showToast(res1.msg)
					}
				})
			}
		})
	},

	// 打开微信授权页面
	openSetting() {
		wx.openSetting({
			success: res => {
				if (res.authSetting['scope.address']) {
					this.chooseAddress()
				}
			}
		})
	}
})