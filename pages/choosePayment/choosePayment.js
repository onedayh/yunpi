import Toast from '../../components/toast/index';
import util from '../../utils/util';
const app = getApp();

Page({
	data: {
		moneyArry: [],
		payId: '',
		number: 0,
		money: 0,
		accountId: 0
	},

	onLoad(e) {
		app.api.payList().then(res => {
			if (res.success) {
				res.data.forEach(item => {
					item.check = false
				})
				this.setData({
					moneyArry: res.data,
					payId: e.id,
					number: e.number,
					money: e.money
				})
			}else{
			    util.showToast(res.msg)
            }
		})
	},

	selectBank(e) {
		let moneyArry = this.data.moneyArry;
		let index = e.currentTarget.dataset.index;
		moneyArry.forEach(item => {
			item.check = false
		})
		moneyArry[index].check = true;
		this.setData({
			moneyArry: moneyArry,
			accountId: e.currentTarget.dataset.id
		})
	},

	pay() {
		app.api.collectFormId();
		if (!this.data.accountId) {
			util.showToast('请选择付款方式');
			return false;
		}
		app.api.orderPay(this.data.payId, this.data.accountId).then(res => {
			if (res.success) {
				Toast({
					type: 'success',
					message: '付款成功，请联系客服！'
				})
				//付款成功记录标识
				wx.setStorageSync("payId", this.data.payId);
				//支付成功跳转页面
				const pages = getCurrentPages();
				let prevPage = pages[pages.length - 2];
				if (prevPage.data.currentTab && prevPage.data.currentTab > 0) {//如果是全部直接跳过，如果是待付款，跳到待核实
					prevPage.setData({
						currentTab: 2
					})
				}
				setTimeout(() => {
					wx.navigateBack()
				}, 1000)

			} else {
                util.showToast(res.msg)
			}
		})
	}
})