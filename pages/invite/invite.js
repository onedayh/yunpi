const app = getApp();
import util from '../../utils/util';

Page({
	data: {
	
	},
	
	onLoad(){
		this.setData({
			reward: app.data.reward,
			prizePrice: app.data.prizePrice
		})
	},

	onShareAppMessage(){
		return{
			title: `你好，为你送上优惠券！首次下单立减${this.data.prizePrice}元哟！`,
			imageUrl: '../../img/share_rec.png',
			path: `/pages/grantAuthor/grantAuthor?customerId=${app.data.customerId}`
		}
	},
	
	goDetail(){
		util.navTo('couponDetail/couponDetail')
	}
})