const app = getApp();
import util from '../../utils/util';
const regTel = /^[1][3-9][0-9]{9}$/;

Page({
	data: {
	    type: '',
        value: '',
        placeholder: '',
        text: '',
        inputType: '',
        inputMax: -1
	},

	onLoad(opts){
        let placeholder = '', text = '提交', title = '', inputType = 'text', inputMax = -1;
        switch (opts.type) {
            case 'nickName':
                placeholder = '昵称';
                title = '设置昵称';
				inputMax = 11;
                break;
            case 'name':
                placeholder = '姓名';
                title = '设置姓名';
				inputMax = 11;
                break;
            case 'company':
                placeholder = '公司名称';
                title = '设置公司名称';
                break;
            case 'phone':
                placeholder = '旧手机号';
                text = '获取验证码';
                title = '换绑手机号';
                inputType = 'number';
                inputMax = 11;
                break;
            case 'newPhone':
                placeholder = '新手机号';
                text = '下一步';
                title = '换绑手机号';
                inputType = 'number';
                inputMax = 11;
                break;
            case 'name_B':
            case 'owen_name_B':
                placeholder = '姓名';
                title = '设置姓名';
				inputMax = 11;
                break;
            case 'address_B':
                placeholder = '地址';
                title = '设置地址';
                break;
            case 'remark_B':
                placeholder = '备注';
                title = '设置备注';
                break;
            default:
                break;
        }
        util.setTitle(title);
        this.setData({
            placeholder: placeholder,
            text: text,
            type: opts.type,
            value: opts.value,
            inputType: inputType,
            inputMax: inputMax
        })
    },

    bindinput(e){
        this.setData({
            value: e.detail.value
        })
    },

    goNext(e){
		const isLogin = app.data.isLogin;
		app.collectFormId(e.detail.formId);
	    const type = this.data.type;
        if(type === 'nickName' || type === 'name' || type === 'company' || type === 'name_B' || type === 'address_B' || type === 'remark_B' || type === 'owen_name_B'){
            this.submit(type)
        }else if(type === 'phone' || type === 'newPhone'){
            this.nextStep()
        }
    },

    // 客户端提交
    submitCustomer(type, value){
        let types = '', opts = null;
        switch (type) {
            case 'nickName':
                types = 'nickname';
                opts = {nickName: value};
                break;
            case 'name':
                types = 'name';
                opts = {name: value};
                break;
            case 'company':
                types = 'company-name';
                opts = {companyName: value};
                break;
        }
        let data = {
            type: types,
            opts: opts
        }
        app.api.setUserInfo(data).then(res => {
            if(res.success){
                util.showToast('提交成功', 'success');
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    const list = prevPage.data.navList[0];
                    list.forEach(item => {
                        if(item.type === type) item.value = value
                    })
                    prevPage.setData({'navList[0]': list}, () => {
                        util.navBack(1)
                    })
                }, 1000)
            }else{
                util.showToast(res.msg)
            }
        })
    },

    // 商家端提交
    submitUser(type, value){
	    if(type === 'owen_name_B'){
	    	// 设置销售自己信息
			app.api.setOwenName_B(value).then(res => {
				if(res.success){
					util.showToast('提交成功', 'success');
					setTimeout(() => {
						const pages = getCurrentPages();
						const prevPage = pages[pages.length - 2];
						const navList =  prevPage.data.navList;
						navList[0][1].value = value;
						prevPage.setData({
							navList: navList
						}, () => {
							util.navBack(1)
						})
					}, 1000)
				}else{
					util.showToast(res.msg)
				}
			})
		}else{
	    	// 设置客户信息
			let data = null;
			switch (type){
				case 'name_B':
					data = {name: value};
					break;
				case 'address_B':
					data = {address: value};
					break;
				case 'remark_B':
					data = {remark: value};
					break;
			}
			app.api.modifyInfo_B({
				...data,
				customerId: this.options.customerId
			}).then(res => {
				if(res.success){
					util.showToast('提交成功', 'success');
					setTimeout(() => {
						const pages = getCurrentPages();
						const prevPage = pages[pages.length - 2];
						const list =  prevPage.data.infoList;
						list.forEach((item, index) => {
							if(index == this.options.index) item.value = value
						})
						prevPage.setData({
							infoList: list
						}, () => {
							util.navBack(1)
						})
					}, 1000)
				}else{
					util.showToast(res.msg)
				}
			})
		}
    },

    // 提交
    submit(type){
	    const value = this.data.value;
        if(!value){
            util.showToast('请输入信息');
            return
        }
        util.showLoading();
	    const isLogin = app.data.isLogin;
	    if(isLogin === 'customer'){
            this.submitCustomer(type, value)
        }else if(isLogin === 'user'){
	        this.submitUser(type, value)
        }
    },

    // 下一步
    nextStep(){
        const _data = this.data;
        if(!regTel.test(_data.value)){
            util.showToast('请输入正确的手机号');
            return
        }
	    app.api.sendVcode(_data.value).then(res => {
	        if(res.success){
	            util.showToast('获取成功', 'success');
	            setTimeout(() => {
	                util.navTo(`fillinverify/fillinverify?type=${_data.type}&phone=${_data.value}`)
                }, 1000)
            }else{
	            util.showToast(res.msg)
            }
        })
    }
})