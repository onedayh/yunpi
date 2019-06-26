import util from '../../utils/util.js';
const app = getApp();
let openD = false;

Page({
    data: {
        load: false,
        baseUrl: app.data.baseUrl,
        list: [],
        allSelect: "circle",
        num: 0,
        count: 0,
        delIndex: 0,

        startX: 0,
        startY: 0,
        openDel: false,
		activity: [],
	
		iconY: 0
    },

    onLoad() {
        openD = false;
        this.getShopcarList();
		this.getActivity();
		this.setData({
			point: app.data.hasUnReadMsg,
			winHei: wx.getSystemInfoSync().windowHeight,
			iconY: wx.getSystemInfoSync().windowHeight - 150
		})
    },
	
	getActivity(){
		app.api.getActivity().then(res => {
			if(res.success){
				this.setData({
					activity: res.data
				})
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	// 客服
	formbutton(e){
		app.collectFormId(e.detail.formId);
		util.navTo(`im/im`)
	},

    getShopcarList() {
        util.showLoading();
        app.api.getShopcarList().then(res => {
            if(res.success){
                let datas = res.data;
                datas.forEach(item => {
                    app.data.shopcar.some(it => {
                        if(item.detailCarId === it.detailCarId){
                            item.change = it.change;
                            item.sku.number += it.change
                        }
                    })
                    item.select = 'circle'
                })
                this.setData({
                    list: datas,
                    load: true
                })
                wx.hideLoading()
            }else{
                util.showToast(res.msg)
            }
        })
    },

    touchS(e) {
        const that = this;
        if (e.touches.length === 1) {
            openD = that.data.openDel;
            that.setData({
                //记录触摸起始位置的X坐标
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                openDel: that.data.delIndex === e.currentTarget.dataset.index ? that.data.openDel : false
            });
        }
    },

    touchM(e) {
        util.debounce(this.touchMove(e), 500)
    },

    touchMove(e) {
        const that = this;
        if (e.touches.length === 1) {
            //触摸点X坐标  起始点的X坐标与当前触摸点的X坐标的差值
            let moveX = e.touches[0].clientX,
                disX = that.data.startX - moveX,
                moveY = e.touches[0].clientY,
                disY = that.data.startY - moveY;
            if (disX >= 100 && disY <= 60) {
                setTimeout(() => {
                    that.setData({
                        openDel: true,
                        delIndex: e.currentTarget.dataset.index,
                    })
                }, openD ? 200 : 0)
            } else if (disX <= -50) {
                that.setData({
                    openDel: false
                })
            }
        }
    },

    //改变选框状态
    change(e) {
        if(e.target.dataset.id) return;
        const that = this,
            index = e.currentTarget.dataset.index,
            select = e.currentTarget.dataset.select;
        let stype = select === "circle" ? "success" : "circle";
        let newList = that.data.list;
        newList[index]['select'] = stype;
        // 是否全部选中
        let all = newList.every(item => {
            return item.select === 'success'
        })
        that.setData({
            list: newList,
            allSelect: all ? 'success' : 'circle'
        })
        that.computed()
    },

    // 改变商品数量
    changeCount(e) {
        const that = this, dataset = e.currentTarget.dataset, newList = that.data.list;
        let num = dataset.num,
            type = dataset.type,
            index = dataset.index,
            change = newList[index].change || 0;
        if (type === 'add') {
            if (num === 999) return;
            change ++;
            num ++
        } else if (type === 'reduce') {
            if (num === 1) return;
            change --;
            num--
        }
        newList[index].sku.number = num;
        newList[index].change = change;
        that.setData({
            list: newList
        })
        that.computed()
    },

    //全选
    allSelect(e) {
        const that = this;
        let allSelect = e.currentTarget.dataset.select,
            newList = that.data.list,
            select = '';
        if (allSelect === "circle") {
            newList.forEach(item => {
                item.select = 'success'
            })
            select = "success"
        } else if (allSelect === "success") {
            newList.forEach(item => {
                item.select = 'circle'
            })
            select = "circle"
        }
        that.setData({
            list: newList,
            allSelect: select
        })
        that.computed()
    },

    //计算总数量和总价格
    computed() {
        const that = this;
        let newList = that.data.list,
            allNum = 0,
            allPrice = 0;
        newList.forEach(item => {
            if (item.select === 'success') {
                allNum += parseInt(item.sku.number);
                allPrice += item.sku.number * item.price
            }
        })
        that.setData({
            num: allNum,
            count: allPrice
        })
    },

    // 删除
    delete(e) {
        const that = this,
            dataset = e.currentTarget.dataset;
        util.showModal('提示', '确定删除该商品吗', res => {
            if (res.confirm) {
                app.api.deleteShopcar(dataset.id).then(res1 => {
                    if(res1.success){
                        let list = that.data.list;
                        list.splice(dataset.index, 1);
                        const data = {
                            list: list,
                            openDel: false,
                            allSelect: list.length === 0 ? 'circle' : that.data.allSelect
                        }
                        that.setData(data, () => {
                            that.computed()
                        })
                        util.showToast('删除成功', 'success');
                        app.data.shopcar.some((item, index) => {
                            if(item.detailCarId === dataset.id){
                                app.data.shopcar.splice(index, 1);
                            }
                        })
                    }else{
                        util.showToast(res1.msg)
                    }

                })
            }
        })
    },

    // 下单
    placeOrder() {
    	app.api.collectFormId();
        const that = this;
        const canOrder = that.data.list.some(item => {
            return item.select === 'success'
        })
        if (!canOrder) {
            util.showToast('请先选择商品');
            return
        }
        let orderList = [];
        that.data.list.forEach(item => {
            if (item.select === 'success') {
                orderList.push({
                    detailCarId: item.detailCarId,
                    number: item.sku.number
                })
            }
        })
        util.navTo(`defaultOrder/defaultOrder?detailCarIds=${JSON.stringify(orderList)}`)
    },

    goGoods(){
    	app.api.collectFormId();
        util.tabTo('allGoods/allGoods')
    },

    onUnload(){
        let changeList = this.data.list.filter(item => {
            return item.change && item.change !== 0
        })
        if(changeList.length > 0){
            let shopcar = [];
            changeList.forEach(item => {
                shopcar.push({
                    detailCarId: item.detailCarId,
                    change: item.change
                })
            })
            app.data.shopcar = shopcar;
        }else{
            app.data.shopcar = []
        }
    },
	
	icontouchmove(e) {
		if (e.touches.length === 1) {
			let moveY = e.touches[0].clientY, winHei = this.data.winHei;
			if(moveY >= winHei - 50) moveY = winHei - 50;
			if(moveY <= 0) moveY = 0;
			this.setData({
				iconY: moveY
			})
		}
	},
})