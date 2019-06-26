const app = getApp();
import util from '../../utils/util';
let page = 1, canPullDown = false;

Page({
	data: {
		baseUrl: app.data.baseUrl,
		load: false,
		goodList: [],
		feedback: '',
		selectId: null
	},
	
	onLoad(){
		page = 1;
		canPullDown = false;
		this.getGoodsList();
	},
	
	// 获取商品列表
	getGoodsList(){
		util.showLoading();
		page = 1;
		app.api.getCardList_B({
			page: page,
			pageSize: app.data.pageSize,
			putaway: true
		}).then(res => {
			if(res.success){
				this.setData({
					goodList: res.data.list,
					load: true
				})
				this.canPull(res.data.lastPage, res.data.totalRecord);
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	canPull(lastPage, totalRecord){
		canPullDown = lastPage ? false : true;
		this.setData({
			feedback: lastPage && totalRecord ? '已加载全部数据' : ''
		})
	},
	
	onReachBottom(){
		const that = this;
		if(!canPullDown) return;
		canPullDown = false;
		that.setData({
			feedback: '加载中...'
		})
		app.api.getCardList_B({
			page: page + 1,
			pageSize: app.data.pageSize,
			putaway: true
		}).then(res => {
			if(res.success){
				that.setData({
					goodList: [...that.data.goodList, ...res.data.list]
				})
				page ++;
				that.canPull(res.data.lastPage, res.data.totalRecord)
			}else{
				canPullDown = true;
				this.setData({
					feedback: '加载失败，请重试'
				})
			}
		})
	},
	
	select(e){
		app.collectFormId(e.detail.formId);
		const id = Number(e.currentTarget.id);
		let {selectId} = this.data;
		selectId = id === selectId ? null : id;
		this.setData({
			selectId: selectId
		})
	},
	
	send(){
		const {selectId} = this.data;
		if(selectId){
			util.showLoading('正在发送...');
			app.api.sendGoods_B(selectId, this.options.toAccount).then(res => {
				if(res.success){
					util.navBack(1);
				}else{
					util.showToast(res.msg)
				}
			})
		}else{
			util.showToast('请选择商品卡')
		}
	}
})