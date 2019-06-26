const app = getApp();
const pageSize = app.data.pageSize;
import util from '../../utils/util';

let tabTop = 0,
	tab = {
		page0: 1,
		canPull0: false,
		top0: 0,
		
		page1: 1,
		canPull1: false,
		top1: 0,
		
		page2: 1,
		canPull2: false,
		top2: 0
	}

Page({
	data: {
		reward: 0,
		
		tabList: ['已邀请', '已完成', '已失效'],
		acTab: 0,
		fixed: false,
		
		feedback0: '',
		load0: false,
		list0: [],
		
		feedback1: '',
		load1: false,
		list1: [],
		
		feedback2: '',
		load2: false,
		list2: []
	},
	
	onLoad(){
		tab = {
			page0: 1,
			canPull0: false,
			top0: 0,
			
			page1: 1,
			canPull1: false,
			top1: 0,
			
			page2: 1,
			canPull2: false,
			top2: 0
		}
		this.getDetail();
		tabTop = 248 * wx.getSystemInfoSync().windowWidth / 750;
		this.setData({
			reward: app.data.reward
		})
	},
	
	changeTab(e){
		const {acTab} = this.data, id = e.currentTarget.dataset.id;
		if(acTab === id) return;
		this.setData({
			acTab: id
		}, () => {
			util.pageTo(tab[`top${id}`]);
			if(!this.data[`load${id}`]){
				this.getDetail()
			}
		})
	},
	
	getDetail(){
		const {acTab} = this.data;
		let obj = {};
		obj[`feedback${acTab}`] = '加载中...';
		this.setData(obj);
		app.api.inviteDetail(acTab, tab[`page${acTab}`], pageSize).then(res => {
			if(res.success){
				const datas = res.data;
				obj[`feedback${acTab}`] = datas.lastPage ? '没有更多了' : '';
				obj[`load${acTab}`] = true;
				datas.list.forEach(item => {
					item.logoUrl = this.handleUrl(item.logoUrl)
				})
				obj[`list${acTab}`] = datas.list;
				tab[`canPull${acTab}`] = datas.lastPage ? false : true;
				this.setData(obj);
			}else{
				obj[`feedback${acTab}`] = res.msg;
				obj[`load${acTab}`] = true;
				this.setData(obj)
			}
		})
	},
	
	handleUrl(url){
		return url ? url.indexOf('http') > -1 ? url : app.data.baseUrl + url : app.data.defaultHead
	},
	
	onReachBottom(){
		const {acTab} = this.data;
		let obj = {};
		if(!tab[`canPull${acTab}`]) return;
		tab[`canPull${acTab}`] = false;
		obj[`feedback${acTab}`] = '加载中...';
		this.setData(obj);
		app.api.inviteDetail(acTab, tab[`page${acTab}`] + 1, pageSize).then(res => {
			if(res.success){
				const datas = res.data;
				obj[`feedback${acTab}`] = datas.lastPage ? '没有更多了' : '';
				datas.list.forEach(item => {
					item.logoUrl = this.handleUrl(item.logoUrl)
				})
				obj[`list${acTab}`] = [...this.data[`list${acTab}`], ...datas.list];
				tab[`canPull${acTab}`] = datas.lastPage ? false : true;
				tab[`page${acTab}`] ++;
				this.setData(obj);
			}else{
				obj[`feedback${acTab}`] = res.msg;
				obj[`load${acTab}`] = true;
				this.setData(obj)
			}
		})
	},
	
	onPageScroll(e){
		const {acTab} = this.data, top = e.scrollTop;
		tab[`top${acTab}`] = top;
		this.setData({
			fixed: top >= tabTop ? true : false
		})
	},
	
	onShareAppMessage(){
		return{
			title: `你好，为你送上优惠券！首次下单立减${app.data.prizePrice}元哟！`,
			imageUrl: '../../img/share_rec.png',
			path: `/pages/grantAuthor/grantAuthor?customerId=${app.data.customerId}`
		}
	},
})