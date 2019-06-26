'use strict';

var DEFAULT_COLOR = '#ff3333';
var DEFAULT_BACKGROUND_COLOR = '#fff';
var DEFAULT_FONT_SIZE = 10;
var DEFAULT_BOX_SHADOW = '0 0 0 2px #ff3333';

Component({
	properties: {
		color: {
			type: String,
			value: DEFAULT_COLOR
		},
		backgroundColor: {
			type: String,
			value: DEFAULT_BACKGROUND_COLOR
		},
		fontSize: {
			type: Number,
			value: DEFAULT_FONT_SIZE
		},
		boxShadow: {
			type: String,
			value: DEFAULT_BOX_SHADOW
		}
	}
});