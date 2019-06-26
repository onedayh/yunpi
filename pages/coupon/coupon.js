const app = getApp();
const pageSize = app.data.pageSize;
import util from '../../utils/util';
let page = 1, canPull = false;

Page({
	data: {
		couponList: [],
		feedback: '',
		load: false
	},
	
	onLoad(){
		page = 1;
		canPull = false;
		this.getData()
	},
	
	getData(){
		util.showLoading();
		app.api.couponList(page, pageSize).then(res => {
			if(res.success){
				let {data} = res;
				data.list.forEach(item => {
					item.endTime = item.endTime.split(' ')[0]
				})
				this.setData({
					couponList: data.list,
					load: true,
					feedback: data.lastPage ? '没有更多了~' : ''
				})
				canPull = data.lastPage ? false : true;
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	onReachBottom(){
		if(!canPull) return;
		canPull = false;
		this.setData({
			feedback: '加载中...'
		})
		app.api.couponList(page + 1, pageSize).then(res => {
			if(res.success){
				let {data} = res;
				data.list.forEach(item => {
					item.endTime = item.endTime.split(' ')[0]
				})
				this.setData({
					couponList: [...this.data.couponList, ...data.list],
					feedback: data.lastPage ? '没有更多了~' : '',
				})
				canPull = data.lastPage ? false : true;
				wx.hideLoading()
			}else{
				canPull = true;
				this.setData({
					feedback: res.msg
				})
			}
		})
	},
	
	goUse(e){
		app.collectFormId(e.detail.formId);
		if(!Number(e.currentTarget.id)) util.tabTo('allGoods/allGoods')
	},
	
	goInvite(){
		util.navTo('invite/invite')
	}
})