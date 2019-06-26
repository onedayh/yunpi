/*
* 小程序API
*/
// wx.showToast()
const showToast = (title, icon = 'none', duration = 1000, mask = true) => {
    wx.showToast({
        title: title,
        icon: icon,
        duration: duration,
        mask: mask
    })
};

// wx.showLoading()
const showLoading = (title = '加载中...', mask = true) => {
    wx.showLoading({
        title: title,
        mask: mask
    })
};

// wx.showModal()
const showModal = (title, content, cb, showCancel = true) => {
    wx.showModal({
        title: title,
        content: content,
        showCancel: showCancel,
        success: res => {
            return cb(res)
        }
    })
};

// wx.showActionSheet()
const showActionSheet = (itemList, cb) => {
    wx.showActionSheet({
        itemList: itemList,
        success: res => {
            return cb(res)
        }
    })
};

// wx.navigateTo()
const navTo = path => {
    wx.navigateTo({
        url: `/pages/${path}`
    })
};

// wx.redirectTo()
const redTo = path => {
    wx.redirectTo({
        url: `/pages/${path}`
    })
};

// wx.reLaunch()
const relTo = path => {
    wx.reLaunch({
        url: `/pages/${path}`
    })
};

// wx.switchTab()
const tabTo = (path) => {
    wx.switchTab({
        url: `/pages/${path}`
    })
};

// wx.navigateBack()
const navBack = delta => {
    wx.navigateBack({
        delta: delta
    })
};

// wx.setNavigationBarTitle
const setTitle = title => {
    wx.setNavigationBarTitle({
        title: title
    })
};

const setTabBarItem = (index, text, iconPath, selectedIconPath) => {
	wx.setTabBarItem({
		index: index,
		text: text,
		iconPath: iconPath,
		selectedIconPath: selectedIconPath
	})
};

const pageTo = (top, time = 0) => {
	wx.pageScrollTo({
		scrollTop: top,
		duration: time
	})
};

/*
* 业务处理函数
*/
// 格式化时间
const formatTime = date => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
};

// 格式化数字
const formatNum = n => {
    n = n.toString();
    return n[1] ? n : '0' + n
};

// 函数防抖
const debounce = (func, delay) => {
    let timer = null;
    // 闭包函数可以访问timer
    return function (...args) {
        // 如果事件被触发，清除timer并重新开始计时
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args)
        }, delay)
    }
};

// 时间戳转换
const getLocalTime = (config) => {
    let {dateJoin = '-'} = config;            // 默认日期连接符：-
    let {timeJoin = ':'} = config;            // 默认时间连接符：:
    let {timeType = 'minutes'} = config;      // 默认精确到分钟（minutes：精确到分钟；seconds：精确到秒）
    let {dataType = 'all'} = config;          // 默认类型为日期+时间（all：日期+时间；date：日期；time：时间）
    if (config.data) {
        let d = new Date(parseInt(config.data) * 1000);
        // let date = d.getFullYear() + dateJoin + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + dateJoin + (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
        let date = ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + dateJoin + (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
        let time;
        // 获取时间（精确到秒）
        if (timeType == 'seconds') {
            time = (d.getHours() < 10 ? '0' + d.getHours() : d.getHours()) + timeJoin + (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + timeJoin + (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
        } else {
            time = (d.getHours() < 10 ? '0' + d.getHours() : d.getHours()) + timeJoin + (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        }
        // 返回日期+时间
        if (dataType === 'all') {
            return date + ' ' + time;
            // 返回日期
        } else if (dataType === 'date') {
            return date;
            // 返回时间
        } else if (dataType === 'time') {
            return time;
        }
    } else {
        return '';
    }
};

const changeTabBar = () => {
	setTabBarItem(0, '助手', 'img/sale.png', 'img/sale_ac.png');
	setTabBarItem(1, '商品', 'img/goods.png', 'img/good_ac.png');
	setTabBarItem(2, '消息', 'img/msg.png', 'img/msg_ac.png');
	setTabBarItem(3, '我', 'img/mine.png', 'img/mine_ac.png');
};

const drawTriangle = (ctx, x1, y1, x2, y2, x3, y3, color, type) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx[type + 'Style'] = color;
	ctx.closePath();
	ctx[type]();
}

const circleImg = (ctx, img, x, y, r) => {
	ctx.save();
	ctx.beginPath();
	const d = 2 * r,
		cx = x + r,
		cy = y + r;
	ctx.arc(cx, cy, r, 0, 2 * Math.PI);
	ctx.clip();
	ctx.drawImage(img, x, y, d, d);
	ctx.restore();
}

const getText = (ctx, text, textCenter, textTop, fontSize, color) => {
	ctx.setFontSize(fontSize);
	const textWidth = ctx.measureText(text.toString()).width;
	ctx.setFillStyle(color);
	ctx.setTextBaseline('middle');
	ctx.fillText(text, textCenter - textWidth / 2, textTop);
}

module.exports = {
    showToast: showToast,
    showLoading: showLoading,
    showModal: showModal,
    showActionSheet: showActionSheet,
    navTo: navTo,
    redTo: redTo,
    relTo: relTo,
    tabTo: tabTo,
    navBack: navBack,
    setTitle: setTitle,
	pageTo: pageTo,

    formatTime: formatTime,
    formatNum: formatNum,
    debounce: debounce,
    getLocalTime: getLocalTime,
	changeTabBar: changeTabBar,
	drawTriangle: drawTriangle,
	circleImg: circleImg,
	getText: getText
};