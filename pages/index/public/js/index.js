export default {
	data() {
		return {
			wechatQrcode: '' // 公众号二维码
		};
	},
	onLoad(data) {
		uni.hideTabBar();
		this.name = 'DIY_VIEW_INDEX';
		this.getFollowQrcode();
	},
	onShow() {},
	computed: {},
	methods: {
		getFollowQrcode() {
			this.$api.sendRequest({
				url: '/wechat/api/wechat/followqrcode',
				success: res => {
					if (res.code >= 0 && res.data) {
						this.wechatQrcode = res.data.qrcode;
					}
				}
			});
		},
		officialAccountsOpen() {
			this.$refs.officialAccountsPopup.open();
		},
		officialAccountsClose() {
			this.$refs.officialAccountsPopup.close();
		}
	},
}
