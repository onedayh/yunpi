import util from '../../utils/util';
import * as echarts from "../../ec-canvas/echarts.min.js";
const app = getApp();
let winW = 0, pageTop = 0;

Page({
	data: {
		baseUrl: app.data.baseUrl,
		tabList: ['销售数据', '客户数据', '商品数据'],
		acTab: 0,
		chooseArr0: [
			{id: 'time', name: '近30天'},
			{id: 'saler', name: '全部销售'},
			{id: 'sort', name: '销售量'}
		],
		chooseArr1: [
			{id: 'time', name: '近30天'},
			{id: 'saler', name: '全部销售'},
			{id: 'sort', name: '销售量'}
		],
		chooseArr2: [
			{id: 'time', name: '今天'},
			{id: 'saler', name: '全部销售'},
			{id: 'sort', name: '销售量'}
		],
		time0:{
			name: '近30天',
			value: '30days'
		},
		time1:{
			name: '近30天',
			value: '30days'
		},
		time2:{
			name: '今日',
			value: 'today'
		},
		salesArr: [],
		saler0: '',
		saler1: '',
		saler2: '',
		sort: 'sale',
		filterArr: [],
		fffArr: [],
		showFilter: false,
		ec: {
			lazyLoad: true
		},
		scale: .5,
		saleCount: 0,
		saleMoney: 0,
		saleBi: 0,
		
		
		load0: false,
		load1: false,
		load2: false
	},
	
	onLoad(){
		pageTop = 0;
		winW =  wx.getSystemInfoSync().windowWidth;
		const query = wx.createSelectorQuery();
		query.select('#choose').boundingClientRect();
		query.selectViewport().scrollOffset();
		query.exec(res => {
			this.setData({
				tabHei: res[0].height,
				tabTop: res[0].top
			})
		})
		this.setData({
			scale: winW / 750,
			filterArr: this.data.chooseArr0,
			scrHei: 88 * 4 *winW / 750
		})
		this.getSaleData();
		this.getImList()
	},
	
	onPageScroll(e){
		pageTop = e.scrollTop;
	},
	
	changeTab(e){
		let id = Number(e.currentTarget.id), {acTab} = this.data;
		if(acTab === id) return;
		let filterArr = [];
		if(id === 0){
			const {load0, chooseArr0} = this.data;
			if(!load0) this.getSaleData();
			filterArr = chooseArr0;
		}else if(id === 1){
			const {load1, chooseArr1} = this.data;
			if(!load1) this.getUserData();
			filterArr = chooseArr1;
		}else{
			const {load2, chooseArr2} = this.data;
			if(!load2) this.getGoodsData();
			filterArr = chooseArr2;
		}
		this.setData({
			acTab: id,
			filterArr: filterArr,
			showFilter: false
		})
	},
	
	// 销售数据
	getSaleData(){
		util.showLoading();
		const {time0, saler0} = this.data;
		app.api.saleData_B({
			timeQuantum: time0.value,
			userId: saler0
		}).then(res => {
			if(res.success){
				let datas = res.data;
				if(datas.length === 0){
					this.setData({
						tableData0: [],
						load0: true
					})
					wx.hideLoading();
					return;
				}
				datas = res.data.reverse();
				let firstDay = datas[0], lastDay = datas[datas.length - 1];
				let title = `${time0.name}销售报表（${firstDay.month}月${firstDay.day}日-${lastDay.month}月${lastDay.day}日）`;
				let xArr = [], goodArr = [], saleCount = 0, saleMoney = 0, saleBi = 0;
				datas.forEach(item => {
					xArr.push(`${item.day}日`);
					goodArr.push(item.totalNumber);
					saleCount += item.totalNumber;
					saleMoney += item.totalShouldPay;
					saleBi += item.count;
					item.date = `${item.month}月${item.day}日`;
				})
				this.setData({
					saleCount: Number(saleCount).toFixed(2),
					saleMoney: Number(saleMoney).toFixed(2),
					saleBi: Number(saleBi).toFixed(2),
					tableData0: [
						{date: '日期', totalNumber: '销售件数', totalShouldPay: '销售金额', count: '笔数'},
						...datas.reverse()
					],
					load0: true
				})
				this.selectComponent('#mychart0').init((canvas, width, height) => {
					const chart = echarts.init(canvas, null, {
						width: width,
						height: height
					});
					this.setOptions(chart, title, '件数', xArr, goodArr);
					this.chart = chart;
					return chart;
				})
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 客户数据
	getUserData(){
		util.showLoading();
		const {time1, saler1} = this.data;
		app.api.userData_B({
			timeQuantum: time1.value,
			userId: saler1
		}).then(res => {
			if(res.success){
				let datas = res.data;
				if(datas.length === 0){
					this.setData({
						tableData1: [],
						load1: true
					})
					wx.hideLoading();
					return;
				}
				datas = res.data.reverse();
				let firstDay = datas[0], lastDay = datas[datas.length - 1];
				let title = `${time1.name}客户报表（${firstDay.month}月${firstDay.day}日-${lastDay.month}月${lastDay.day}日）`;
				let xArr = [], goodArr = [];
				datas.forEach(item => {
					xArr.push(`${item.day}日`);
					goodArr.push(item.count);
					item.date = `${item.month}月${item.day}日`;
				})
				this.setData({
					tableData1: [
						{date: '日期', count: '累计客户', inc: '增长客户', active: '互动频次'},
						...datas.reverse()
					],
					load1: true
				})
				this.selectComponent('#mychart1').init((canvas, width, height) => {
					const chart = echarts.init(canvas, null, {
						width: width,
						height: height
					});
					this.setOptions(chart, title, '客户/人', xArr, goodArr);
					this.chart = chart;
					return chart;
				})
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 商品数据
	getGoodsData(){
		util.showLoading();
		const {time2, saler2, sort} = this.data;
		app.api.goodsData_B({
			timeQuantum: time2.value,
			userId: saler2,
			propName: sort,
			dir: 'desc'
		}).then(res => {
			if(res.success){
				this.setData({
					load2: true,
					goodsData: res.data
				})
				wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	
	setOptions(chart, title, name, xArr, goodArr) {
		const {scale} = this.data;
		const option = {
			title: {
				text: title,
				left: 'left',
				top: 14 * scale,
				textStyle: {
					color: '#999',
					fontSize: 24 * scale
				}
			},
			color: ["#F33"],
			legend: {
				data: [name],
				top: 60 * scale,
				left: 20 * scale,
				itemGap: 400 * scale,
				itemWidth: 0,
				itemHeight: 0,
				z: 100,
				textStyle: {
					color: '#272D3C',
					fontSize: 20 * scale
				}
			},
			grid: {
				containLabel: true,
				left: 0,
				top: 120 * scale,
				right: 20 * scale,
				bottom: 30 * scale
			},
			tooltip: {
				show: true,
				trigger: 'axis',
				position: function (pos, params, dom, rect, size) {
					// 鼠标在左侧时 tooltip 显示到右侧，鼠标在右侧时 tooltip 显示到左侧。
					var obj = {top: 60};
					obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 25;
					return obj;
				}
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: xArr,
				axisLine:{		// 坐标轴
					lineStyle:{
						color:'#272D3C',
						fontSize: 20 * scale
					}
				}
			},
			yAxis: [{
				x: 'center',
				type: 'value',
				splitLine: {		// 风格线
					lineStyle: {
						type: 'solid',
						color: '#eee'
					}
				},
				axisLine:{		// 坐标轴
					lineStyle:{
						color:'#272D3C',
						fontSize: 20 * scale
					}
				}
			}],
			series: [{
				name: name,
				type: 'line',
				smooth: true,
				yAxisIndex: 0,
				data: goodArr
			}]
		};
		chart.setOption(option);
	},
	
	// 获取销售
	getImList(){
		app.api.getImList().then(res => {
			if(res.success){
				const {data} = res;
				let arr = [];
				data.forEach(item => {
					arr.push({
						id: item.userId,
						name: item.nickName
					})
				})
				this.setData({
					salesArr: arr
				})
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	filterS(e){
		const {id} = e.currentTarget;
		let fffArr = [], modePt = 0, {scrHei, scale, tabHei, tabTop, showFilter, filterType} = this.data;
		if(id === filterType && showFilter){
			this.setData({
				showFilter: false
			})
			return
		}
		switch (id) {
			case 'time':
				fffArr = [
					{id: '7days', name: '近7天'},
					{id: '30days', name: '近30天'},
					{id: 'thisMonth', name: '本月'},
					{id: 'lastMonth', name: '上月'}
				];
				if(this.data.acTab === 2){
					fffArr = [
						{id: 'today', name: '今日'},
						...fffArr
					];
					scrHei = 88 * 5 * scale;
				}else{
					scrHei = 88 * 4 * scale;
				}
				break;
			case 'saler':
				fffArr = [
					{id: '', name: '全部销售'},
					...this.data.salesArr
				];
				scrHei = 88 * 5 * scale;
				break;
			case 'sort':
				fffArr = [
					{id: 'sale', name: '销售量'},
					{id: 'share', name: '转发量'},
					{id: 'pv', name: '访问量'}
				];
				scrHei = 88 * 3 * scale;
				break;
		}
		modePt = tabTop - pageTop + tabHei;
		this.setData({
			modePt: modePt,
			showFilter: true,
			fffArr: fffArr,
			scrHei: scrHei,
			filterType: id
		})
	},
	
	changeFilter(e){
		const {id, name} = e.currentTarget.dataset, {filterType, acTab} = this.data;
		let obj = {};
		switch (filterType) {
			case 'time':
				if(id === this.data['time' + acTab]){
					this.setData({
						showFilter: false
					})
					return;
				}
				if(acTab === 0){
					let {chooseArr0, time0} = this.data;
					chooseArr0[0].name = name;
					time0 = {
						value: id,
						name: name
					};
					obj = {
						chooseArr0: chooseArr0,
						time0: time0,
						filterArr: chooseArr0
					}
				}else if(acTab === 1){
					let {chooseArr1, time1} = this.data;
					chooseArr1[0].name = name;
					time1 = {
						value: id,
						name: name
					};
					obj = {
						chooseArr1: chooseArr1,
						time1: time1,
						filterArr: chooseArr1
					}
				}else if(acTab === 2){
					let {chooseArr2, time2} = this.data;
					chooseArr2[0].name = name;
					time2 = {
						value: id,
						name: name
					};
					obj = {
						chooseArr2: chooseArr2,
						time2: time2,
						filterArr: chooseArr2
					}
				}
				break;
			case 'saler':
				if(id === this.data['saler' + acTab]){
					this.setData({
						showFilter: false
					})
					return;
				}
				if(acTab === 0){
					let {chooseArr0, saler0} = this.data;
					chooseArr0[1].name = name;
					saler0 = id;
					obj = {
						chooseArr0: chooseArr0,
						saler0: saler0,
						filterArr: chooseArr0
					}
				}else if(acTab === 1){
					let {chooseArr1, saler1} = this.data;
					chooseArr1[1].name = name;
					saler1 = id;
					obj = {
						chooseArr1: chooseArr1,
						saler1: saler1,
						filterArr: chooseArr1
					}
				}else if(acTab === 2){
					let {chooseArr2, saler2} = this.data;
					chooseArr2[1].name = name;
					saler2 = id;
					obj = {
						chooseArr2: chooseArr2,
						saler2: saler2,
						filterArr: chooseArr2
					}
				}
				break;
			case 'sort':
				if(id === this.data.sort){
					this.setData({
						showFilter: false
					})
					return;
				}
				let {chooseArr2, sort} = this.data;
				chooseArr2[2].name = name;
				sort = id;
				obj = {
					chooseArr2: chooseArr2,
					sort: sort,
					filterArr: chooseArr2
				}
				break;
		}
		console.log(obj)
		this.setData({
			...obj,
			showFilter: false
		}, () => {
			if(acTab === 0){
				this.getSaleData()
			}else if(acTab === 1){
				this.getUserData()
			}else if(acTab === 2){
				this.getGoodsData()
			}
		})
	},
	
	handleMode(e){
		if(e.target.id === 'mode'){
			this.setData({
				showFilter: false
			})
		}
	}
});