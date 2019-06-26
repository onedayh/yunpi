import util from '../../utils/util';
const app = getApp();

Page({
	data: {
		name: '',
		content: ''
	},
	onLoad(opts){
		this.setData({
			name: opts.name
		})
	},
	
	bindinput(e){
		const value = e.detail.value;
		this.setData({
			content: value
		})
	},
	
	add(e){
		app.collectFormId(e.detail.formId);
		const content = this.data.content;
		if(content.trim().length === 0){
			util.showToast('请输入内容');
			return
		}
		app.api.addNote_B(this.options.id, this.data.content).then(res => {
			if(res.success){
				util.showToast('保存成功', 'success');
				const pages = getCurrentPages();
				const prev = pages[pages.length - 2];
				prev.setData({
					add: true,
					'clue.page': 1
				});
				setTimeout(() => {
					util.navBack(1)
				}, 1000)
			}else{
				util.showToast(res.msg)
			}
		})
	}
})