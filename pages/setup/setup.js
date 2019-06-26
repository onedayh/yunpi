import util from '../../utils/util';
const app = getApp();
let info = null;

Page({
    data: {
        navList: [],
    },

    onLoad(opts){
        info = JSON.parse(opts.info);
        const {isLogin} = app.data;
        let navList = null;
        if(isLogin === 'customer'){
			navList = [
				[
					{type: 'head', value: info.logoUrl ? info.logoUrl.indexOf('http') > -1 ? info.logoUrl : app.data.baseUrl + info.logoUrl : app.data.defaultHead, name: '头像'},
					{type: 'nickName', value: info.nickName && info.nickName != 'null'? info.nickName : '', name: '昵称'},
					// {type: 'name', value: info.name, name: '姓名'},
					{type: 'company', value: info.companyName, name: '公司名称'}
				],
				[
					{type: 'phone', value: info.bindPhone, name: '绑定手机号'},
					// {type: 'service', value: info.userName, name: '绑定客服'}
				]
			]
		}else{
        	navList = [
        		[
					{type: 'head', value: info.logoPath ? info.logoPath.indexOf('http') > -1 ? info.logoPath : app.data.baseUrl + info.logoPath : app.data.defaultHead, name: '头像'},
					{type: 'owen_name_B', value: info.nickName, name: '姓名'},
					{value: info.jobNumber, name: '工号'},
					{value: info.phoneMobile, name: '手机号'},
					{value: info.organizationName, name: '所属门店'}
				]
			]
		}
        this.setData({
            navList: navList
        })
    },

    // 下一步
    goNext(e){
        const dataset = e.currentTarget.dataset;
        if(dataset.type){
			if(dataset.type === 'head'){
				this.setHead()
			}else if(dataset.type === 'service'){
				util.navTo('choseStor/choseStor?from=set')
			}else{
				util.navTo(`getverify/getverify?type=${dataset.type}&value=${dataset.value}`)
			}
		}
    },

    // 改头像
    setHead(){
        wx.chooseImage({
            count: 1,
            success: res => {
                const imgFile = res.tempFilePaths[0], {isLogin} = app.data;
                wx.uploadFile({
                    url: app.data.baseUrl +　(isLogin === 'customer' ? '/wxa/customer/set-avatar.htm' : '/wxab/set-avatar.htm'),
                    filePath: imgFile,
                    name: 'imgFile',
                    header: {
                        'cookie': 'SESSION=' + wx.getStorageSync('sessionid'),
                        'content-type': 'multipart/form-data'
                    },
                    success: () => {
                        this.setData({
                            'navList[0][0].value': imgFile
                        })
                    },
                    fail: err => {
                    	console.log(err)
                        util.showToast('上传失败')
                    }
                })
            }
        })
    }
})