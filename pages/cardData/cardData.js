const app = getApp();
import util from '../../utils/util';

Page({
	data: {
		baseUrl: app.data.baseUrl,
		tabList: ['今天', '近7天', '近30天'],
		acTab: 0,
		mydata: {},
		dataList: [],
		dataList1: [],
		dataList2: [],
		dataList3: [],
		pageSize: 10,
		type: null,
		
		load1: false,
		page1: 1,
		feedback1: '加载中...',
		loadMore1: false,
		data1: [],
		
		load2: false,
		page2: 1,
		feedback2: '加载中...',
		loadMore2: false,
		data2: [],
		
		load3: false,
		page3: 1,
		feedback3: '加载中...',
		loadMore3: false,
		data3: []
	},
	onLoad(opts){
		if(opts.type){
			util.setTitle(opts.type == '7' ? '加入购物车详情' : opts.type == '8' ? '收藏详情' : opts.type == '18' ? '销量详情' : opts.type == '13' ? '客户转发详情' : '商品卡数据');
			const actab = Number(opts.actab);
			this.setData({
				type: opts.type,
				acTab: actab,
				mydata: JSON.parse(opts.mydata)
			}, () => {
				this.getData2(actab === 0 ? '' : actab === 1 ? 7 : actab === 2 ? 30 : '')
			});
		}else{
			this.getData('')
		}
	},
	
	changeTab(e){
		const id = Number(e.currentTarget.dataset.id), {acTab, type, load1, load2, load3, dataList1, dataList2, dataList3} = this.data;
		if(id === acTab) return;
		if(id === 0){
			if(!type){
				if(load1){
					this.setData({dataList: dataList1})
				}else{
					this.getData('');
				}
			}
			if(type && !load1) this.getData2('');
		}else if(id === 1){
			if(!type){
				if(load2){
					this.setData({dataList: dataList2})
				}else{
					this.getData(7);
				}
			}
			if(type && !load2) this.getData2(7);
		}else if(id === 2){
			if(!type){
				if(load3){
					this.setData({dataList: dataList3})
				}else{
					this.getData(30);
				}
			}
			if(type && !load3) this.getData2(30);
		}
		this.setData({acTab: id});
	},
	
	getData(day){
		util.showLoading();
		app.api.getCardData_B(this.options.id, day).then(res => {
			if(res.success){
				const datas = res.data, {load1, load2, load3} = this.data;
				datas.createTime = datas.createTime.slice(5);
				const dataList = [
					{id: 8, name: '收藏人数', value: datas.collect},
					{id: 7, name: '加入购物车人数', value: datas.cart},
					{name: '分享次数', value: datas.share},
					{id: 13, name: '客户转发次数', value: datas.recommend},
					{id: 18, name: '销量', value: datas.salesVolume},
					{name: '', value: ''}
				];
				this.setData({
					mydata: datas,
					dataList: dataList,
					load1: day === '' ? true : load1,
					load2: day === 7 ? true : load2,
					load3: day === 30 ? true : load3,
				})
				if(day === ''){
					this.setData({
						load1: true,
						dataList1: dataList,
					})
				}else if(day === 7){
					this.setData({
						load2: true,
						dataList2: dataList,
					})
				}else if(day === 30){
					this.setData({
						load3: true,
						dataList3: dataList,
					})
				}
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	goNext(e){
		const {id} = e.currentTarget;
		if(id) util.navTo(`cardData/cardData?id=${this.options.id}&type=${id}&actab=${this.data.acTab}&mydata=${JSON.stringify(this.data.mydata)}`)
	},
	
	getData2(day){
		const {pageSize, acTab} = this.data;
		const {id, type} = this.options;
		app.api.getCardDetailData_B({
			cardId: id,
			page: 1,
			pageSize: pageSize,
			day: day,
			type: type,
		}).then(res => {
			if(res.success){
				const datas = res.data;
				switch (day) {
					case '':
						this.setData({
							data1: this.formatArr(datas.list),
							load1: true,
							feedback1: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore1: datas.lastPage ? false : true
						})
						break;
					case 7:
						this.setData({
							data2: this.formatArr(datas.list),
							load2: true,
							feedback2: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore2: datas.lastPage ? false : true
						})
						break;
					case 30:
						this.setData({
							data3: this.formatArr(datas.list),
							load3: true,
							feedback3: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
							loadMore3: datas.lastPage ? false : true
						})
						break;
				}
			}else{
				switch (day) {
					case '':
						this.setData({feedback1: res.msg});
						break;
					case 7:
						this.setData({feedback2: res.msg});
						break;
					case 30:
						this.setData({feedback3: res.msg});
						break;
				}
			}
		})
	},
	
	// 数据处理
	formatArr(arr){
		if(arr.length > 0){
			arr.forEach(item => {
				const time = item.createTime.split(' ');
				if(time.length > 1){
					let t = time[0];
					if(t.indexOf('-') > -1) t = t.substring(5);
					item.t_date = t;
					item.t_hour = time[1];
				}else{
					item.t_date = time[0];
					item.t_hour = '';
				}
			})
		}
		return arr
	},
	
	onReachBottom(){
		const {data} = this;
		const {id, type} = this.options;
		let day = null, page = null;
		if(data.acTab === 0){
			if(!data.loadMore1) return;
			page = data.page1 + 1;
			day = '';
			this.setData({
				loadMore1: false,
				feedback1: '加载中...'
			})
		}else if(data.acTab === 1){
			if(!data.loadMore2) return;
			page = data.page2 + 1;
			day = 7;
			this.setData({
				loadMore2: false,
				feedback2: '加载中...'
			})
		}else if(data.acTab === 2){
			if(!data.loadMore3) return;
			page = data.page3 + 1;
			day = 30;
			this.setData({
				loadMore3: false,
				feedback3: '加载中...'
			})
		}
		app.api.getCardDetailData_B({
			cardId: id,
			page: page,
			pageSize: data.pageSize,
			day: day,
			type: type,
		}).then(res => {
			if(res.success){
				const datas = res.data;
				switch (day) {
					case '':
						this.setData({
							data1: data.data1.concat(this.formatArr(datas.list)),
							load1: true,
							feedback1: datas.lastPage ? '已加载全部数据' : '',
							loadMore1: datas.lastPage ? false : true,
							page1: page
						})
						break;
					case 7:
						this.setData({
							data2: data.data2.concat(this.formatArr(datas.list)),
							load2: true,
							feedback2: datas.lastPage ? '已加载全部数据' : '',
							loadMore2: datas.lastPage ? false : true,
							page2: page
						})
						break;
					case 30:
						this.setData({
							data3: data.data3.concat(this.formatArr(datas.list)),
							load3: true,
							feedback3: datas.lastPage ? '已加载全部数据' : '',
							loadMore3: datas.lastPage ? false : true,
							page3: page
						})
						break;
				}
			}else{
				switch (day) {
					case '':
						this.setData({feedback1: res.msg});
						break;
					case 7:
						this.setData({feedback2: res.msg});
						break;
					case 30:
						this.setData({feedback3: res.msg});
						break;
				}
			}
		})
	},
})