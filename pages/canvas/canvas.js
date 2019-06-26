const app = getApp();
import util from '../../utils/util';
const baseUrl = app.data.baseUrl;
let salerData = null,				// 销售数据
	cardData = null,				// 商品卡数据
	headSize = null;
Page({
    data: {
		cvsW: null,									// 画布宽度
		cvsH: null,									// 画布高度
		headSize: null,								// 头像尺寸
		filePath: null,
		label: ['客户至上', '专属服务', '合作共赢'],
    },
		
    onLoad(opts){
    	util.showLoading();
		salerData = null;
		cardData = null;
    	wx.getSystemInfo({
			success: res => {
				const winW = res.windowWidth;				// 屏幕宽度
				const scale = winW / 750;					// 比例  px = rpx * scale
				this.setData({
					cvsW: 730 * scale,			// 画布宽度
					cvsH: 1088 * scale,				// 画布高度
				});
				headSize =  160 * scale;
				if(opts.salerId){
					util.setTitle('销售海报');
					this.getSalerData(scale, opts.salerId)
				}
				if(opts.cardId){
					util.setTitle('商品卡海报');
					this.getCardData(scale, opts.cardId)
				}
			}
		});
    },
	
	// 获取销售数据
	getSalerData(scale, id){
    	app.api.getSalerData(id, this.options.userId ? this.options.userId : '').then(res => {
    		if(res.success){
				salerData = res.data;
				app.changeImg(salerData.logoPath).then(res => {
					salerData.logoPath = res;
					app.changeImg(salerData.picture).then(res1 => {
						salerData.picture = res1;
						app.changeImg(salerData.qrcodeUrl).then(res2 => {
							salerData.qrcodeUrl = res2;
							this.drawSalerCvs(scale)
						})
					})
				})
			}else{
    			util.showToast(res.msg)
			}
		})
	},
	// 绘制销售海报
	drawSalerCvs(scale){
		const {cvsW, cvsH, label} = this.data;
		const labelMargin = 30 * scale;
		const ctx = wx.createCanvasContext('myCanvas');
		// 背景图片
		ctx.drawImage('../../img/saler_bg.png', 0, 0, cvsW, cvsH);
		// 白色背景
		ctx.setFillStyle('#fff');
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(130 * scale, 818 * scale, 470 * scale, 30 * scale);
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(90 * scale, 778 * scale, 550 * scale, 40 * scale);
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(50 * scale, 148 * scale, 630 * scale, 630 * scale);
		
		// 头像
		util.circleImg(ctx, salerData.logoPath, (cvsW - headSize) / 2, 68 * scale, headSize / 2);
		// 店铺logo
		// util.circleImg(ctx, salerData.picture, 590 * scale, 176 * scale, 30 * scale);
		// 姓名
		ctx.setFontSize(48 * scale);
		ctx.setFillStyle('#333');
		ctx.setTextAlign('center');
		ctx.setTextBaseline('middle');
		ctx.fillText(`销售：${salerData.nickName}`, cvsW / 2, 280 * scale);
		// 服务
		ctx.setFontSize(24 * scale);
		ctx.setFillStyle('#999');
		ctx.fillText(`服务${salerData.customerSize}个客户`, cvsW / 2, 340 * scale);
		// 标签
		// 中间
		ctx.setFontSize(20 * scale);
		const labelWidth = ctx.measureText(label[1]).width;
		const labelBgWidth = labelWidth + 24 * scale;
		ctx.setFillStyle('#13B5FE');
		const label2_left = (cvsW - labelBgWidth) / 2,
			 label2_right = (cvsW + labelBgWidth) / 2;
		ctx.fillRect(
			label2_left,
			385 * scale,
			labelBgWidth,
			32 * scale
		);
		ctx.setFillStyle('#fff');
		ctx.fillText(label[1], cvsW / 2, 400 * scale);
		// 左边
		ctx.setFillStyle('#13B5FE');
		ctx.fillRect(
			label2_left - labelMargin - labelBgWidth,
			385 * scale,
			labelBgWidth,
			32 * scale
		);
		ctx.setTextAlign('right');
		ctx.setFillStyle('#fff');
		ctx.fillText(label[0], label2_left - labelMargin - 12 * scale, 400 * scale);
		// 右边
		ctx.setFillStyle('#13B5FE');
		ctx.fillRect(
			label2_right + labelMargin,
			385 * scale,
			labelBgWidth,
			32 * scale
		);
		ctx.setTextAlign('left');
		ctx.setFillStyle('#fff');
		ctx.fillText(label[2], label2_right + labelMargin + 12 * scale, 400 * scale);
		
		// 分割线
		ctx.setStrokeStyle('#e6e6e6');
		ctx.moveTo(110 * scale, 460 * scale);
		ctx.lineTo(620 * scale, 460 * scale);
		ctx.stroke();
		
		// 联系信息
		ctx.setFontSize(24 * scale);
		ctx.setFillStyle('#999');
		ctx.fillText(`电话：${salerData.phoneMobile}`, 110 * scale, 540 * scale);
		ctx.fillText(`微信：${salerData.wechat}`, 110 * scale, 600 * scale);
		const address = salerData.address;
		if(address.length > 12){
			const two = address.substr(12);
			const addWidth = ctx.measureText('地址：').width;
			ctx.fillText(`地址：${address.substr(0, 12)}`, 110 * scale, 660 * scale);
			if(two.length > 12){
				const three = two.substr(12);
				ctx.fillText(`${two.substr(0, 12)}`, addWidth + 110 * scale, 700 * scale);
				ctx.fillText(`${three}`, addWidth + 110 * scale, 740 * scale);
			}else{
				ctx.fillText(`${two}`, addWidth + 110 * scale, 700 * scale);
			}
		}else{
			ctx.fillText(`地址：${salerData.address}`, 110 * scale, 660 * scale);
		}
		// 小程序码
		util.circleImg(ctx, salerData.qrcodeUrl, 480 * scale, 518 * scale, 88 * scale);
		ctx.draw();
		wx.hideLoading();
	},
	
	// 获取商品卡数据
	getCardData(scale, id){
    	app.api.getCardInfo(id, this.options.userId ? this.options.userId : '').then(res => {
    		if(res.success){
				cardData = res.data;
				app.changeImg(cardData.imagePath[0]).then(res => {
					cardData.imagePath[0] = res;
					app.changeImg(cardData.qrcodeUrl).then(res1 => {
						cardData.qrcodeUrl = res1;
						const length = cardData.ortherCustomerLogo.length;
						if(length > 0){
							app.changeImg(cardData.ortherCustomerLogo[0]).then(res2 => {
								cardData.ortherCustomerLogo[0] = res2;
								if(length > 1){
									app.changeImg(cardData.ortherCustomerLogo[1]).then(res3 => {
										cardData.ortherCustomerLogo[1] = res3;
										if(length >  2){
											app.changeImg(cardData.ortherCustomerLogo[2]).then(res4 => {
												cardData.ortherCustomerLogo[2] = res4;
												if(length >  3){
													app.changeImg(cardData.ortherCustomerLogo[3]).then(res5 => {
														cardData.ortherCustomerLogo[3] = res5;
														if(length >  4){
															app.changeImg(cardData.ortherCustomerLogo[4]).then(res6 => {
																cardData.ortherCustomerLogo[4] = res6;
																if(length >  5){
																	app.changeImg(cardData.ortherCustomerLogo[5]).then(res7 => {
																		cardData.ortherCustomerLogo[5] = res7;
																		this.drawCardCvs(scale)
																	});
																}else{
																	this.drawCardCvs(scale)
																}
															});
														}else{
															this.drawCardCvs(scale)
														}
													});
												}else{
													this.drawCardCvs(scale)
												}
											});
										}else{
											this.drawCardCvs(scale)
										}
									});
								}else{
									this.drawCardCvs(scale)
								}
							});
						}else{
							this.drawCardCvs(scale)
						}
					});
				});
			}else{
    			util.showToast(res.msg)
			}
		})
	},
	// 绘制商品卡海报
	drawCardCvs(scale){
		const {cvsW, cvsH} = this.data;
		const ctx = wx.createCanvasContext('myCanvas');
		// 背景图片
		ctx.drawImage('../../img/saler_bg.png', 0, 0, cvsW, cvsH);
		// 白色背景
		ctx.setFillStyle('#fff');
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(130 * scale, 918 * scale, 470 * scale, 30 * scale);
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(90 * scale, 878 * scale, 550 * scale, 40 * scale);
		ctx.setShadow(0, 1, 1, 'rgba(151, 151, 151, .5)');
		ctx.fillRect(50 * scale, 128 * scale, 630 * scale, 750 * scale);
		
		// 商品图片
		ctx.drawImage(cardData.imagePath[0], 110 * scale, 68 * scale, 510 * scale, 510 * scale);
		// 价格
		ctx.setTextBaseline('middle');
		ctx.setFillStyle('#333');
		ctx.setFontSize(48 * scale);
		ctx.fillText(`￥${cardData.price.toFixed(2)}`, 110 * scale, 630 * scale);
		// 款号 上新日期
		ctx.setFontSize(24 * scale);
		const style = `款号 ${cardData.styleNumber}`;
		ctx.fillText(style, 110 * scale, 690 * scale);
		const styleWidth = ctx.measureText(style).width;
		ctx.fillText(`上新日期 ${cardData.createTime.substr(5)}`, 130 * scale + styleWidth, 690 * scale);
		// 测款
		const unlikeWidth = ctx.measureText(cardData.unlike.toString()).width;
		const likeWidth = ctx.measureText(cardData.like.toString()).width;
		const unlikeBgWidth = unlikeWidth + 48 * scale;
		const likeBgWidth = likeWidth + 48 * scale;
		// unlike
		ctx.setFillStyle('rgba(153, 153, 153, .1)');
		ctx.fillRect(cvsW - 110 * scale - unlikeBgWidth, 612 * scale, unlikeBgWidth, 36 * scale);
		ctx.setFillStyle('#666');
		ctx.setTextAlign('right');
		ctx.fillText(cardData.unlike, cvsW - 118 * scale, 628 * scale);
		ctx.drawImage('../../img/like2.png', cvsW - 102 * scale - unlikeBgWidth, 620 * scale, 20 * scale, 20 * scale);
		// like
		ctx.setFillStyle('rgba(255, 51, 51, .1)');
		ctx.fillRect(cvsW - 110 * scale - unlikeBgWidth - likeBgWidth, 612 * scale, likeBgWidth, 36 * scale);
		ctx.setFillStyle('#f33');
		ctx.fillText(cardData.like, cvsW - 118 * scale - unlikeBgWidth, 628 * scale);
		ctx.drawImage('../../img/like1.png', cvsW - 102 * scale - unlikeBgWidth - likeBgWidth, 620 * scale, 20 * scale, 20 * scale);
		
		// 浏览
		let seeHeadLeft = 110 * scale;
		const logoArr = [...cardData.ortherCustomerLogo, '../../img/see.png'];
		logoArr.forEach(item => {
			util.circleImg(ctx, item, seeHeadLeft, 740 * scale, 28 * scale);
			seeHeadLeft += 46 * scale;
		})
		ctx.setFillStyle('#999');
		ctx.setTextAlign('left');
		ctx.fillText(`${cardData.seeVolume}人浏览了`, 110 * scale, 830 * scale);

		// 小程序码
		util.circleImg(ctx, cardData.qrcodeUrl, 480 * scale, 660 * scale, 88 * scale);
		ctx.draw();
		wx.hideLoading();
	},
	
	// 点击保存
	handleSave() {
    	util.showLoading();
		if(this.data.filePath){
			this.getting();
		}else{
			wx.canvasToTempFilePath({
				canvasId: 'myCanvas',
				success: res => {
					this.setData({ filePath: res.tempFilePath });
					this.getting()
				},
				fail: () => {
					util.showToast('保存失败，请重试!')
				}
			})
		}
	},
	
	// 判断授权信息
	getting(){
		wx.getSetting({
			success: res => {
				const auth = res.authSetting;
				if (Object.keys(auth).indexOf('scope.writePhotosAlbum') === -1 || auth['scope.writePhotosAlbum']) {
					this.saveSuccess()
				} else if (!auth['scope.address']) {
					wx.hideLoading();
					util.showModal('提示', '你已拒绝保存到相册授权，请按确定前往新页面选中‘保存到相册’重新授权', res1 => {
						if (res1.confirm) this.openSetting()
					})
				}
			}
		})
	},
	
	// 保存
	saveSuccess(){
		wx.saveImageToPhotosAlbum({
			filePath: this.data.filePath,
			fileType: 'jpg',
			success: () => {
				wx.hideLoading();
				util.showModal('提示', `${this.options.salerId ? '销售海报' : '商品卡图片'}已保存到手机相册，你可以分享到朋友圈了`, res => {
					if(res.confirm){
						util.navBack(1)
					}
				})
				if(this.options.salerId){
					if(app.data.isLogin === 'customer'){
						app.api.recordShareSaler(this.options.salerId);
					}
				}
				if(this.options.cardId){
					if(app.data.isLogin === 'customer'){
						app.api.goodShareSuc(this.options.cardId);
					}else{
						app.api.goodShareSuc_B(this.options.cardId)
					}
				}
			},
			fail: () => {
				wx.hideLoading()
			}
		})
	},
	
	openSetting(){
		wx.openSetting({
			success: res => {
				if (res.authSetting['scope.writePhotosAlbum']) {
					util.showLoading();
					this.saveSuccess()
				}
			}
		})
	},
})