const app = getApp();
const regTel = /^[1][3-9][0-9]{9}$/;
let timer = null, loginType = null;
import util from '../../utils/util.js';

Component({
	data: {
		phone: '', 			// 手机号
		vCode: '', 			// 验证码
		canSend: true, 		// 是否可以发送验证码
		second: 60, 		// 验证码获取时间间隔
		hasSetting: false,
	},
	
	ready(){
		timer = null;
		loginType = null;
		const phone = wx.getStorageSync('phone');
		if (phone) this.setData({ phone: phone });
		this.hasSetting();
	},
	
	methods: {
		// 输入手机号
		getPhone(e) {
			const phone = e.detail.value;
			this.setData({
				phone: phone
			})
		},
		
		// 输入验证码
		getVcode(e) {
			const vCode = e.detail.value;
			this.setData({
				vCode: vCode
			})
		},
		
		// 发送验证码
		sendVcode() {
			const that = this;
			// 首先判断是否能发送验证码（60s倒计时）
			if (!that.data.canSend) return;
			const phone = that.data.phone;
			if (phone.length === 11 && regTel.test(phone)) {
				// 手机号格式正确， 才允许发送验证码
				util.showLoading('正在发送...');
				app.api.sendVcode(phone).then(res => {
					if (res.success) {
						that.setData({
							canSend: false
						})
						loginType = res.data;
						util.showToast('发送成功', 'success');
						// 验证码发送成功后，设置定时器，60s内不允许发送验证码
						let second = 60;
						timer = setInterval(() => {
							second--;
							if (second === 0) {
								that.setData({
									second: 60,
									canSend: true
								})
								clearInterval(timer);
								return
							}
							that.setData({
								second: second
							})
						}, 1000)
					} else {
						util.showToast(res.msg)
					}
				})
			} else {
				util.showToast('请输入正确的手机号')
			}
		},
		
		login() {
			const that = this,
				_data = that.data;
			if (!(_data.phone.length === 11 && regTel.test(_data.phone))) {
				util.showToast('请输入正确的手机号')
			} else if (_data.vCode.length !== 6) {
				util.showToast('请输入正确的验证码')
			} else {
				util.showLoading('正在登录...');
				app.api.checkVcode(_data.vCode).then(res => {
					if (res.success) {
						wx.setStorageSync('phone', _data.phone);
						wx.login({
							success: res => {
								if(loginType === 'customer') {
									// 客户身份
									app.api.login(res.code).then(res1 => {
										if (res1.success) {
											// 页面卸载清除定时器
											clearInterval(timer);
											wx.setStorageSync('phone', _data.phone);
											if (res1.code === '') {
												// 已注册
												wx.setStorageSync('isLogin', loginType);
												app.data.isLogin = loginType;
												this.triggerEvent('login', {type: 'customer'})
											} else if (res1.code === 'reg') {
												// 未注册 -> 绑定当前客服
												this.triggerEvent('login', {type: 'new_customer'})
											}
										} else {
											util.showToast(res1.msg)
										}
									})
								}else if(loginType === 'user'){
									app.api.login_B(res.code).then(res => {
										if(res.success){
											// 销售身份
											// 页面卸载清除定时器
											clearInterval(timer);
											wx.setStorageSync('isLogin', loginType);
											app.data.isLogin = loginType;
											this.triggerEvent('login', {type: 'user'})
										}else{
											util.showToast(res.msg)
										}
									})
								}
							}
						})
					} else {
						util.showToast(res.msg)
					}
				})
			}
		},
		
		
		hasSetting(){
			wx.getSetting({
				success: res => {
					if(res.authSetting['scope.userInfo']){
						// 已经授权，可以直接调用 getUserInfo 获取头像昵称
						wx.getUserInfo({
							success: res1 => {
								app.data.userInfo = res1.userInfo;
								this.setData({
									hasSetting: true
								})
							}
						})
					}else{
						this.setData({
							hasSetting: false
						})
					}
				}
			})
		},
		
		bindgetuserinfo(e){
			if(e.detail.userInfo){
				app.data.userInfo = e.detail.userInfo;
				this.login()
			}
		}
	}
});