const app = getApp();
import util from '../../utils/util';

Component({
	properties: {
		couponData: {
			type: Object,
			value: {
				show: false,
				name: '',
				price: 0
			}
		}
	},
	
	data: {
		time: ''
	},
	
	ready(){
		const date = new Date();
		let year = date.getFullYear(), month = date.getMonth() + 2, day = date.getDate();
		if(month >= 13){
			month = 1;
			year ++;
		}
		this.setData({
			time: `${year}-${this.formatNum(month)}-${this.formatNum(day)}`
		})
	},
	
	methods: {
		goBuy(){
			util.tabTo('allGoods/allGoods')
		},
		cha(){
			this.triggerEvent('cha')
		},
		formatNum(n){
			n = n.toString();
			return n.length === 1 ? `0${n}` : n
		}
		
	}
})
