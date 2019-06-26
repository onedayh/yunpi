const app = getApp();
import util from '../../utils/util';
import * as echarts from '../../ec-canvas/echarts.min.js';
let winW = 0, tabTop = 0, top1 = 0, top2 = 0, top3 = 0, top4 = 0, timer = null;

Page({
	data: {
		baseUrl: app.data.baseUrl,
		acTab: 0,
		tabList: ['线索', '资料', '订单', '分析'],

		// 线索
		cluePage: 1,
		customer: {
			name: '',
			im: '',
			head: '',
			level: '',
			time: ''
		},
		load1: false,
		loadMore1: false,
		feedback1: '加载中...',
		clueList: [],
		
		// 资料
		infoList: [
			{name: '来源', value: ''},
			{name: '手机号码', value: ''},
			{id: 'name', name: '姓名', value: ''},
			{name: '昵称', value: ''},
			{id: 'area', name: '地区', value: '', mode: 'region'},
			{id: 'address', name: '地址', value: ''},
			{id: 'birthday', name: '生日', value: '', mode: 'date'},
			{id: 'customerLevel', name: '客户等级', value: '', mode: 'selector'},
			{id: 'category', name: '客户类别', value: '', mode: 'selector'},
			{id: 'suitablePrice', name: '适用价格', value: '', mode: 'selector'},
			{id: 'remark', name: '备注', value: ''}
		],
        lList: ['黄钻', '白钻', '黑钻'],
        cList: [],
        pList: [],
		noteList: [],
		
		// 订单
		orderPage: 1,
		load3: false,
		loadMore3: false,
		feedback3: '加载中...',
		orderList: [],
		orderText: '订单',
		textArr: [
			{name: '待发货', id: 'waitShipment'},
			{name: '待付款', id: 'waitPay'},
			{name: '待核实', id: 'verifyPay'},
			{name: '已发货', id: 'shipment'},
			{name: '已完成', id: 'finish'},
			{name: '已作废', id: 'cancel'}
		],
		
		// 分析
		dateArr: [
			{id: '', name: '今天'},
			{id: 7, name: '近7天'},
			{id: 30, name: '近30天'}
		],
		centerId: 7,
		shopId: 7,
		ec: {
			lazyLoad: true
		},
		scale: .5,
		centerList: []
	},
	
	onLoad(e){
		top1 = 0; top2 = 0; top3 = 0; top4 = 0; clearInterval(timer);
		winW =  wx.getSystemInfoSync().windowWidth;
		tabTop = 200 * winW / 750;
		if(e && e.actab == '1'){
			this.setData({
				acTab: 1
			})
		}
		this.getCustomerClue();
		this.getCustomerInfo();
	},
	
	// 获取客户线索
	getCustomerClue(){
		app.api.getClueList_B({
			page: this.data.cluePage,
			pageSize: app.data.pageSize,
			customerId: this.options.id
		}).then(res => {
			if(res.success){
				let datas = res.data;
				this.setData({
					clueList: this.formatArr(datas.list),
					load1: true,
					feedback1: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
					loadMore1: datas.lastPage ? false : true
				})
			}else{
				this.setData({feedback1: res.msg})
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
					if(t.indexOf('月') > -1) t = t.replace('月', '-').replace('日', '');
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
	
	// 下拉加载更多
	onReachBottom(){
		if(this.data.acTab === 0 && this.data.loadMore1){
			this.setData({
				feedback1: '加载中...',
				loadMore1: false
			});
			const page = this.data.cluePage;
			app.api.getClueList_B({
				page: page + 1,
				pageSize: app.data.pageSize,
				customerId: this.options.id
			}).then(res => {
				if(res.success){
					let datas = res.data;
					this.setData({
						clueList: this.data.clueList.concat(this.formatArr(datas.list)),
						feedback1: datas.lastPage ? '已加载全部数据' : '',
						loadMore1: datas.lastPage ? false : true,
						cluePage: page + 1
					})
				}else{
					this.setData({
						feedback1: res.msg,
						loadMore1: true
					})
				}
			})
		}else if(this.data.acTab === 2 && this.data.loadMore3){
			this.setData({
				feedback3: '加载中...',
				loadMore3: false
			});
			const page = this.data.orderPage;
			app.api.getOrder_B({
				page: page + 1,
				pageSize: 5,
				customerId: this.options.id
			}).then(res => {
				if(res.success){
					let datas = res.data;
					clearTimeout(timer);
					const hasTimer = this.countDown(this.data.orderList.concat(datas.list));
					setTimeout(() => {
						this.setData({
							feedback3: datas.lastPage ? '已加载全部数据' : '',
							loadMore3: datas.lastPage ? false : true,
							orderPage: page + 1
						})
					}, hasTimer ? 1000 : 0);
				}else{
					this.setData({
						feedback3: res.msg,
						loadMore3: true
					})
				}
			})
		}
	},
	
	// 获取客户资料
	getCustomerInfo(){
		app.api.getCustomerInfo_B(this.options.id).then(res => {
			if(res.success){
				const datas = res.data;
				let notes = datas.notes;
				if(notes.length > 0){
					notes.forEach(item => {
						let time = item.createTime.split(' ');
						item.t_date = time[0].substr(5);
						item.t_hour = time[1];
					})
				}
				this.setData({
					customer: {
						name: datas.name,
						im: datas.imAccount,
						head: datas.logoUrl ? datas.logoUrl.indexOf('http') > -1 ? datas.logoUrl : app.data.baseUrl + datas.logoUrl : app.data.defaultHead,
						level: this.data.lList[datas.customerLevel-1],
						time: datas.activeTime,
					},
                    infoList: [
                        {name: '来源', value: datas.source},
                        {name: '手机号码', value: datas.bindPhone},
                        {id: 'name', name: '姓名', value: datas.name},
                        {name: '昵称', value: datas.nickName},
                        {id: 'area', name: '地区', value: datas.area, mode: 'region'},
                        {id: 'address', name: '地址', value: datas.address},
                        {id: 'birthday', name: '生日', value: datas.birthday, mode: 'date'},
                        {id: 'customerLevel', name: '客户等级', value: this.data.lList[datas.customerLevel-1], mode: 'selector'},
                        {id: 'category', name: '客户类别', value: datas.category || '', mode: 'selector'},
                        {id: 'suitablePrice', name: '适用价格', value: datas.suitablePrice || '', mode: 'selector'},
                        {id: 'remark', name: '备注', value: datas.remark || ''}
                    ],
					noteList: notes
				})
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	scrollTo(top){
		wx.pageScrollTo({
			scrollTop: top,
			duration: 0
		})
	},
	
	getform(e){
		app.collectFormId(e.detail.formId)
	},
	
	// 切换tab
	changeTab(e){
	    const id = Number(e.currentTarget.dataset.id);
		this.setData({acTab: id});
		switch (id) {
			case 0:
				this.scrollTo(top1);
				break;
			case 1:
				this.scrollTo(top2);
				if(this.data.pList.length === 0) this.getBaseList();
				break;
			case 2:
				this.scrollTo(top3);
				if(!this.data.load3){
					this.getOrderCount();
					this.getOrderList()
				}
				break;
			case 3:
				this.scrollTo(top4);
				if(!this.chart){
					this.vitalityAnalyze();
					this.centerAnalyze(7, true);
					this.buyingAnalyze(7, true)
				}
				break;
		}
	},
	
	// 发消息
	goIm(e){
		app.collectFormId(e.detail.formId);
		if(this.options.from === 'im'){
			util.navBack(1)
		}else{
			util.navTo(`im/im?toAccount=${e.detail.target.dataset.id}`)
		}
	},
	
	// 滚动
	onPageScroll(e){
		const scrollTop = e.scrollTop;
		const {acTab} = this.data;
		switch (acTab) {
			case 0:
				top1 = scrollTop;
				break;
			case 1:
				top2 = scrollTop;
				break;
			case 2:
				top3 = scrollTop;
				break;
			case 3:
				top4 = scrollTop;
				break;
		}
	},

	// 获取基础数据
    getBaseList(){
	    app.api.getBaseList_B().then(res => {
	        if(res.success){
                this.setData({
                    cList: res.data.category,
                    pList: res.data.price
                })
            }else{
	            util.showToast(res.msg)
            }
        })
    },

	// 下一页修改
    goNext(e){
	    const set = e.currentTarget.dataset;
	    if(set.id){
	        if(set.id === 'name' || set.id === 'address' || set.id === 'remark'){
	            util.navTo(`getverify/getverify?type=${set.id}_B&index=${set.index}&value=${set.value}&customerId=${this.options.id}`)
            }
        }
    },

	// 选择修改
    bindChange(e){
	    util.showLoading();
        let value = e.detail.value, data = null;
        const set = e.target.dataset, _data = this.data;
        if(set.id === 'area') value = value.join('');
        switch (set.id){
            case 'area':
                data = {area: value};
                break;
            case 'birthday':
                data = {birthday: value};
                break;
            case 'customerLevel':
                data = {customerLevel: Number(value)+1};
                break;
            case 'category':
                data = {category: _data.cList[value]};
                break;
            case 'suitablePrice':
                data = {suitablePrice: _data.pList[value]};
                break;
        }
        app.api.modifyInfo_B({
            ...data,
            customerId: this.options.id
        }).then(res => {
            if(res.success){
                const infoList = _data.infoList;
                infoList.forEach(item => {
                    if(item.id === set.id){
                        if(set.id === 'area' || set.id === 'birthday'){
                            item.value = value
                        }else if(set.id === 'customerLevel'){
                            item.value = _data.lList[value];
                            this.setData({
								customer: {
									..._data.customer,
									level: _data.lList[value]
								}
							})
                        }else if(set.id === 'category'){
                            item.value = _data.cList[value]
                        }else if(set.id === 'suitablePrice'){
                            item.value = _data.pList[value]
                        }
                    }
                })
                this.setData({
                    infoList: infoList
                })
                util.showToast('设置成功', 'success')
            }else{
                util.showToast(res.msg)
            }
        })
    },
	
	// 获取订单数量
	getOrderCount(){
		app.api.getOrderCount_B(this.options.id).then(res => {
			if(res.success){
				const datas = res.data;
				let orderText = '', num = 0;
				this.data.textArr.forEach(item => {
					const n = datas[item.id];
					if(n > 0){
						num += n;
						orderText += `，${item.name}${n}个`
					}
				})
				orderText = `共${num}个订单${orderText}`;
				this.setData({
					orderText: orderText
				})
			}else{
				this.setData({
					orderText: res.msg
				})
			}
		})
	},
	
	// 获取订单列表
	getOrderList(){
		app.api.getOrder_B({
			page: this.data.orderPage,
			pageSize: 5,
			customerId: this.options.id
		}).then(res => {
			if(res.success){
				const datas = res.data;
				const hasTimer = this.countDown(datas.list);
				setTimeout(() => {
					this.setData({
						load3: true,
						feedback3: datas.lastPage && datas.totalRecord > 0 ? '已加载全部数据' : '',
						loadMore3: datas.lastPage ? false : true
					})
				}, hasTimer ? 1000: 0);
			}else{
				this.setData({
					feedback: res.msg
				})
			}
		})
	},
	
	// 待付款计时
	countDown(arr) {
		const hasTimer = arr.some(item => {
			return item.orderStatus === 1
		})
		if(hasTimer){
			timer = setInterval(() => {
				arr.forEach(item => {
					if(item.orderStatus === 1){
						let t = parseInt(new Date(item.createTime.replace(/-/g, '/')).getTime() / 1000) + 48 * 60 * 60 - parseInt(new Date().getTime() / 1000)
						if (t <= 0) { //付款时间已过，扭转状态变成已作废
							clearInterval(timer);
							item.orderStatus = 6;
							item.orderStatusText = '已作废';
						} else {
							let hours = util.formatNum(parseInt(t / 3600));
							let mins = util.formatNum(parseInt((t % 3600) / 60));
							let seconds = util.formatNum(parseInt(t % 60));
							item.countdown = `剩${hours}小时${mins}分${seconds}秒`;
						}
						this.setData({
							orderList: arr
						})
					}
				})
			}, 1000);
		}else{
			this.setData({
				orderList: arr
			})
		}
		return hasTimer
	},
	
	goToDetail(e){
		util.navTo(`orderDetails/orderDetails?id=${e.currentTarget.dataset.id}&fromInfo=true`)
	},
	
	// 活跃度分析
	vitalityAnalyze(){
		util.showLoading();
		this.setData({
			scale: winW / 750
		})
		app.api.vitalityAnalyze_B(this.options.id).then(res => {
			if(res.success){
				const datas = res.data, firstDay = datas[0], lastDay = datas[datas.length - 1];
				let title = `${firstDay.month}月${firstDay.day}日-${lastDay.month}月${lastDay.day}日`;
				let xArr = [], timeArr = [], goodArr = [];
				datas.forEach(item => {
					xArr.push(`${item.day}日`);
					timeArr.push((item.seconds / 60).toFixed(2));
					goodArr.push(item.number);
				})
				this.selectComponent('#mychart').init((canvas, width, height) => {
					const chart = echarts.init(canvas, null, {
						width: width,
						height: height
					});
					this.setOptions(chart, title, xArr, timeArr, goodArr);
					this.chart = chart;
					return chart;
				})
				wx.hideLoading();
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 核心行为分析
	centerAnalyze(day, hide){
		app.api.centerAnalyze_B(this.options.id, day).then(res => {
			if(res.success){
				const datas = res.data;
				this.setData({
					centerList: [
						{name: '收藏商品数', value: datas.collectRow},
						{name: '加入购物车', value: datas.cartRow},
						{name: '分享商品次数', value: datas.productRow},
						{name: '分享销售次数', value: datas.saleRow}
					],
					centerId: day
				})
				if(!hide) wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 购买行为分析
	buyingAnalyze(day, hide){
		app.api.buyingAnalyze_B(this.options.id, day).then(res => {
			if(res.success){
				const datas = res.data;
				this.setData({
					shopList: [
						{name: '购买件数', value: datas.totalNumber},
						{name: '购买笔数', value: datas.size},
						{name: '客单价', value: datas.average},
						{name: '总支付金额', value: datas.totalRealityPrice}
					],
					shopId: day
				})
				if(!hide) wx.hideLoading()
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	changeData(e){
		const set = e.currentTarget.dataset;
		if(set.type === 'center'){
			if(set.id === this.data.centerId) return;
			util.showLoading();
			this.centerAnalyze(set.id);
		}else if(set.type === 'shop'){
			if(set.id === this.data.shopId) return;
			util.showLoading();
			this.buyingAnalyze(set.id)
		}
	},
	
	setOptions(chart, title, xArr, timeArr, goodArr) {
		const {scale} = this.data;
		const option = {
			title: {
				text: `最近30日活动趋势（${title}）`,
				left: 'left',
				top: 14 * scale,
				textStyle: {
					color: '#999',
					fontSize: 24 * scale
				}
			},
			color: ["#00C2B2", "#F33"],
			legend: {
				data: ['访问商品数', '访问时长'],
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
					obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
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
			}, {
				x: 'center',
				type: 'value',
				splitLine: {		// 风格线
					lineStyle: {
						type: 'solid',
						color: 'transparent'
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
				name: '访问商品数',
				type: 'line',
				smooth: true,
				yAxisIndex: 0,
				data: goodArr
			}, {
				name: '访问时长',
				type: 'line',
				smooth: true,
				yAxisIndex: 1,
				data: timeArr
			}]
		};
		chart.setOption(option);
	},
	
	onUnload(){
		clearInterval(timer)
	}
})