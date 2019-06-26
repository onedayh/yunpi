import util from '../../utils/util';
const app = getApp();

Page({
	data: {
		detail: {},
		address: {
			addressId: 0
		},
        isDefault: true,
		detailCarIds: '',
		baseUrl: app.data.baseUrl,
        load: false
	},

	submitOrder() {
		app.api.collectFormId();
	    const _data = this.data;
		if (!_data.address.addressId) {
		    util.showToast('请选择收货地址');
			return false;
		}
		util.showLoading('提交中...');
		app.api.createOrder(_data.detailCarIds, _data.address.addressId).then(res => {
			if (res.success) {
			    app.checkWxpay().then(wxpay => {
			    	if(wxpay){
			    		// 微信支付
						app.api.launchWxpay(res.data.reservationId).then(res1 => {
							if(res1.success){
								wx.requestPayment({
									...res1.data,
									success: () => {
										util.showToast('支付成功', 'success');
										app.data.waitSendOrder = true;
										util.tabTo(`personOwen/personOwen`)
									},
									fail: () => {
										util.showToast('支付失败');
										app.data.waitPayOrder = true;
										util.tabTo(`personOwen/personOwen`)
									}
								})
							}else{
								util.showToast(res1.msg)
							}
						})
					}else{
			    		util.showToast('提交成功', 'success');
						setTimeout(() => {
							app.data.waitPayOrder = true;
							util.tabTo(`personOwen/personOwen`)
						}, 1000)
					}
				})
			 
			} else {
			    util.showToast(res.msg)
			}
		})

	},
	
	onLoad(e) {
	    util.showLoading();
		const detailCarIds = e.detailCarIds;
		app.api.checkOut(detailCarIds).then(res => {
		    if(res.success){
                res.data.supplyList.forEach(item => {
                    item.color = item.sku.split(";")[0];
                    item.size = item.sku.split(";")[1]
                })
                if (res.data.address && res.data.address.addressId) {
                    this.setData({
                        address: {...res.data.address, defaultAddress: true}
                    })
                }
                this.setData({
                    detail: res.data,
                    detailCarIds: detailCarIds,
                    load: true
                })
                wx.hideLoading()
            }else{
		        util.showToast(res.msg)
            }
		})
	},

    setDefault(){
	    if(this.data.address.defaultAddress) return;
	    util.showLoading();
	    let data = {
            addressId: this.data.address.addressId,
            defaultAddress: true
        }
	    app.api.setAddress(data).then(res => {
	        if(res.success){
                util.showToast('设置成功', 'success');
                this.setData({
                    'address.defaultAddress': true
                })
            }else{
	            util.showToast(res.msg)
            }
        })
    }
})