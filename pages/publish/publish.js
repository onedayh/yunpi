const app = getApp();
import util from '../../utils/util';
const num = /^[0-9]+([.]{1}[0-9]{1,2})?$/;
Page({
	data: {
		baseUrl: app.data.baseUrl,
		title: '',
		style: '',
		img: [],
		optsArr: [],
		
		info: [], 		//{type: 'img', url: ''}, {type: 'text', text: ''}
		top: 5000,
		
		showText: false,
		textarea: '',
		infoIndex: null,
		
		showColor: false,
		colorTree: [],
		colorArr: [],
		
		showSize: false,
		sizeTree: [],
		sizeArr: [],
		
		categoryTree: [],
		categoryIndex: -1,
		
		sizeIndex: null
	},
	
	onLoad(opts){
		const imgs = JSON.parse(opts.img);
		imgs.forEach(item => {
			this.updateImg('sq', item)
		})
		this.getAllOptions();
	},
	
	// 新增图片
	add(){
		const {img} = this.data;
		wx.chooseImage({
			count: 9 - img.length,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: res => {
				util.showLoading();
				res.tempFilePaths.forEach(item => {
					this.updateImg('sq', item)
				})
				wx.hideLoading();
			},
			fail: err => {
				console.log(err)
			}
		})
	},
	
	change(e){
		const {id} = e.currentTarget, type = e.target.id, {img} = this.data;
		if(type === 'change'){
			// 更换图片
			wx.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: res => {
					this.updateImg('sq', res.tempFilePaths[0], id)
				},
				fail: err => {
					console.log(err)
				}
			})
		}else if(type === 'delete'){
			// 删除图片
			util.showModal('提示', '确定删除此图片吗？', res => {
				if(res.confirm){
					img.splice(id, 1);
					this.setData({
						img: img
					})
				}
			})
		}
	},
	
	getAllOptions(){
		app.api.getAllOptions_B().then(res => {
			if(res.success){
				const {data} = res;
				let priceArr = [];
				data.suitablePrice.forEach(item => {
					priceArr.push({
						type: 'input',
						name: item,
						price: ''
					})
				})
				this.setData({
					optsArr: [
						{type: 'view', name: '颜色', value: '', id: 'color'},
						{type: 'view', name: '尺码', value: '', id: 'size'},
						{type: 'picker', name: '类别', value: '', id: 'category'},
						...priceArr
					],
					sizeTree: data.size,
					colorTree: data.color,
					categoryTree: data.categories
				})
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	inputTitle(e){
		this.setData({
			title: e.detail.value
		})
	},
	
	inputStyle(e){
		this.setData({
			style: e.detail.value
		})
	},
	
	inputPrice(e){
		let index = Number(e.currentTarget.id), {optsArr} = this.data;
		optsArr[index].price = e.detail.value;
		this.setData({
			optsArr: optsArr
		})
	},
	
	addInfopic(){
		wx.chooseImage({
			count: 9,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: res => {
				this.updateImg('info', res.tempFilePaths[0])
			},
			fail: err => {
				console.log(err)
			}
		})
	},
	
	addInfoText(){
		this.setData({
			textarea: '',
			showText: true,
			infoIndex: null
		})
	},
	
	changeInfo(e){
		const {id, type} = e.currentTarget.dataset, handle = e.target.id;
		let {info} = this.data;
		if(handle === 'pic'){
			wx.chooseImage({
				count: 1,
				sizeType: 'compressed',
				success: res => {
					this.updateImg('info', res.tempFilePaths[0], id)
				},
				fail: err => {
					console.log(err)
				}
			})
		}else if(handle === 'text'){
			this.setData({
				infoIndex: id,
				textarea: info[id].value,
				showText: true
			})
		}else if(handle === 'delete'){
			util.showModal('提示', `确定删除此${type === 'img' ? '图片' : type === 'text' ? '段文字' : ''}吗？`, res => {
				if(res.confirm){
					info.splice(id, 1);
					this.setData({
						info: info
					})
				}
			})
		}
	},
	
	inputText(e){
		this.setData({
			textarea: e.detail.value
		})
	},
	
	textConfirm(){
		let {infoIndex, info, textarea, top} = this.data;
		if(!textarea.trim()){
			util.showToast('请输入文字');
			return;
		}
		// 编辑文字
		if(infoIndex || infoIndex === 0){
			info.splice(infoIndex, 1, {type: 'text', text: textarea})
		}else{
			info.push({type: 'text', text: textarea});
			top += 100
		}
		this.setData({
			showText: false,
			info: info,
			top: top
		})
	},
	
	// 发布商品
	publish(){
		const {data} = this;
		if(!(data.title &&
			data.style &&
			data.img.length > 0 &&
			data.colorArr.length > 0 &&
			data.sizeArr.length > 0 &&
			data.categoryIndex > -1)
		){
			util.showToast('请填写完整商品信息');
			return;
		}
		let regNum = data.optsArr.some(item => {
			return item.price && !num.test(item.price)
		})
		if(regNum){
			util.showToast('请输入正确的价格');
			return;
		}
		let stock = [], suitablePrice = {}, pic = [];
		data.optsArr.forEach((item, index) => {
			if(index >= 3 && item.price){
				suitablePrice[item.name] = item.price
			}
		})
		data.colorArr.forEach(item => {
			data.sizeArr.forEach(it => {
				stock.push({
					size: it,
					color: item
				})
			})
		})
		data.img.forEach(item => {
			pic.push(item.slice(6, -4))
		})
		app.api.publish_B({
			stock: JSON.stringify(stock),
			styleNumber: data.style,
			commodityName: data.title,
			imageMD5s: pic.join(','),
			categoryId: data.categoryTree[data.categoryIndex].categoryId,
			suitablePrice: JSON.stringify(suitablePrice),
			commodityInfo: JSON.stringify(data.info)
		}).then(res => {
			if(res.success){
				app.data.isPublish = true;
				util.showModal('提示', '上传成功！点击[确定]继续上传，点击[取消]退出。', res => {
					if(res.confirm){
						let {optsArr} = this.data;
						optsArr.forEach(item => {
							if(item.price) item.price = '';
							if(item.value) item.value = ''
						})
						this.setData({
							title: '',
							style: '',
							img: [],
							optsArr: optsArr,
							info: [],
							textarea: '',
							infoIndex: null,
							colorArr: [],
							sizeArr: [],
							categoryIndex: -1,
							sizeIndex: null
						})
						util.pageTo(0);
					}else{
						util.navBack(1)
					}
				});
			}else{
				util.showToast(res.msg)
			}
		})
	},
	
	bindmode(e){
		if(e.target.id === 'mode'){
			this.setData({
				showText: false,
				showColor: false,
				showSize: false
			})
		}
	},
	
	showView(e){
		const {id, type} = e.currentTarget.dataset;
		if(type === 'input') return;
		if(id === 'color'){
			this.setData({showColor: true})
		}else if(id === 'size'){
			this.setData({showSize: true})
		}
	},
	
	chooseColor(e){
		const {id} = e.currentTarget.dataset, {colorArr} = this.data;
		const arrIndex = colorArr.indexOf(id);
		arrIndex > -1 ? colorArr.splice(arrIndex, 1) : colorArr.push(id);
		this.setData({
			colorArr: colorArr
		})
	},
	
	chooseSize(e){
		const {id, index} = e.currentTarget.dataset;
		let {sizeIndex, sizeArr} = this.data;
		if(sizeIndex === index){
			const arrIndex = sizeArr.indexOf(id);
			arrIndex > -1 ? sizeArr.splice(arrIndex, 1) : sizeArr.push(id);
		}else{
			sizeArr = [id]
		}
		this.setData({
			sizeArr: sizeArr,
			sizeIndex: index
		})
	},
	
	changeCategory(e){
		const {optsArr, categoryTree} = this.data, index = e.detail.value;
		optsArr[2].value = categoryTree[index].categoryName;
		this.setData({
			categoryIndex: index,
			optsArr: optsArr
		})
	},
	
	comfirm(){
		const {showColor, showSize, optsArr, colorArr, sizeArr} = this.data;
		if(showColor && !showSize) {
			optsArr[0].value = colorArr.join(',');
		}else if(showSize && !showColor){
			optsArr[1].value = sizeArr.join(',');
		}
		this.setData({
			showColor: false,
			showSize: false,
			optsArr: optsArr
		})
	},
	
	cancel(){
		const {showColor, showSize, optsArr} = this.data;
		let obj = {};
		if(showColor && !showSize) {
			obj = {colorArr: []};
			optsArr[0].value = '';
		}else if(showSize && !showColor){
			obj = {sizeArr: []};
			optsArr[1].value = '';
		}
		this.setData({
			...obj,
			showColor: false,
			showSize: false,
			optsArr: optsArr
		})
	},
	
	// 上传图片
	updateImg(type, url, id = null){
		return new Promise(() => {
			wx.uploadFile({
				url: this.data.baseUrl + '/wxab/upload-image.htm',
				filePath: url,
				name: 'imgFile',
				header: {
					'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
					'content-type': 'multipart/form-data'
				},
				success: res => {
					if(res.statusCode === 200){
						const datas = JSON.parse(res.data);
						if(datas.success){
							if(type === 'sq'){
								const {img} = this.data;
								if(id !== null){
									img.splice(id, 1, datas.data.url)
								}else{
									img.push(datas.data.url);
								}
								this.setData({
									img: img
								})
							}else if(type === 'info'){
								const {info, top} = this.data;
								if(id !== null){
									info.splice(id, 1, {type: 'img', url: datas.data.url})
								}else{
									info.push({type: 'img', url: datas.data.url})
								}
								this.setData({
									info: info,
									top: id !== null ? top : top + 100
								})
							}
						}else{
							util.showToast(datas.msg)
						}
					}
				},
				fail: () => {
					util.showToast('上传失败')
				}
			})
		})
	}
})