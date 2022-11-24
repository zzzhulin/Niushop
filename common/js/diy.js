import WxMap from 'common/js/map-wx-jssdk.js';

let systemInfo = uni.getSystemInfoSync();
export default {
	data() {
		return {
			diyData: {
				global: {
					title: '',
					popWindow: {
						imageUrl: '',
						count: -1,
						link: {},
						imgWidth: '',
						imgHeight: ''
					}
				}
			},
			memberId: 0,
			name: '',
			isDefault: '',

			store: {}, //首页展示的门店详情
			storeId: 0, //首页展示的门店id

			pageHeight: '0',
			headerHeight: '0',
			bottomHeight: '0',
			topIndexValue: null,
			statusBarHeight: systemInfo.statusBarHeight,
			collectTop: 44,
			showTip: false,
			mpCollect: false,
			mpShareData: null, //小程序分享数据
			scrollTop: 0, // 滚动位置
			paddingTop: (44 + systemInfo.statusBarHeight) + 'px',
			marginTop: -(44 + systemInfo.statusBarHeight) + 'px',
			pullDownRefresh: true, //下拉刷新
			followOfficialAccount: null, // 关注公众号组件
			isLoad: false // 检测是否刷新
		};
	},
	onLoad(data) {
		uni.hideTabBar();
		this.name = data.name || '';
		this.isDefault = data.is_default || '';

		if (data.source_member) uni.setStorageSync('source_member', data.source_member);

		// 小程序扫码进入
		if (data.scene) {
			var sceneParams = decodeURIComponent(data.scene);
			sceneParams = sceneParams.split('&');
			if (sceneParams.length) {
				sceneParams.forEach(item => {
					if (item.indexOf('m') != -1) uni.setStorageSync('source_member', item.split('-')[1]);
				});
			}
		}

	},
	onShow() {
		if (uni.getStorageSync('token')) {
			this.$util.getMemberId().then(resolve => {
				this.memberId = resolve;
			});
		}

		this.store = uni.getStorageSync('store') ? uni.getStorageSync('store') : null;
		if (this.store) this.storeId = this.store.store_id;

		this.getDiyInfo();
		this.getHeight();

		//记录分享关系
		if (uni.getStorageSync('token') && uni.getStorageSync('source_member')) {
			this.$util.onSourceMember(uni.getStorageSync('source_member'));
		}

		//小程序分享
		// #ifdef MP-WEIXIN
		this.$util.getMpShare().then(res => {
			this.mpShareData = res;
		});
		// #endif

	},
	computed: {
		bgColor() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.pageBgColor;
			}
			return str;
		},
		bgImg() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.topNavBg ? 'url(' + this.$util.img(this.diyData.global.bgUrl) + ')' : this
					.diyData.global.pageBgColor;
			}
			return str;
		},
		bgUrl() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.topNavBg ? 'transparent' : this.diyData.global.bgUrl;
			}
			return str;
		},
		bgNav() {
			if (this.diyData.global.topNavColor) {
				return {
					background: this.diyData.global.topNavColor
				};
			} else {
				return {
					background: '#ffffff'
				};
			}
		},
		backgroundUrl() {
			var str = this.diyData.global.bgUrl && this.diyData.global.bgUrl != 'transparent' ? 'url(' + this.$util.img(
				this.diyData.global.bgUrl) + ') ' : '';
			return str;
		},
		textNavColor() {
			if (this.diyData && this.diyData.global && this.diyData.global.textNavColor) {
				return this.diyData.global.textNavColor;
			} else {
				return '#ffffff';
			}
		},
		openBottomNav() {
			let str = false;
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.openBottomNav;
			}
			return str;
		},
		globalS() {
			return this.diyData.global;
		},
		//计算首页弹框的显示宽高
		popWindowStyle() {
			// 做大展示宽高
			let max_width = 290;
			let max_height = 410;
			// 参照宽高
			let refer_width = 290;
			let refer_height = 290;

			let scale = this.diyData.global.popWindow.imgHeight / this.diyData.global.popWindow.imgWidth;
			let width, height;
			if (scale < refer_height / refer_width) {
				width = max_width;
				height = width * scale;
			} else {
				height = max_height;
				width = height / scale;
			}

			let obj = '';
			if (this.diyData.global.popWindow && this.diyData.global.popWindow.count != -1 && this.diyData.global
				.popWindow.imageUrl) {
				obj += 'height:' + (height * 2) + 'rpx;';
				obj += 'width:' + (width * 2) + 'rpx;';
			}
			return obj;
		},
		scrollHeight() {
			if (this.pageHeight != undefined && this.headerHeight != undefined && this.bottomHeight != undefined) {
				return 'calc(' + this.pageHeight * 2 + 'rpx - ' + this.headerHeight + ' - ' + this.bottomHeight + ')';
			} else {
				return '100vh';
			}
		},
		scrollTopHeight() {
			if (this.pageHeight != undefined && this.headerHeight != undefined && this.bottomHeight != undefined) {
				return 'calc(' + this.pageHeight * 2 + 'rpx - ' + this.headerHeight + ' - ' + this.bottomHeight +
					' - 80rpx)';
			} else {
				return '100vh';
			}
		}
	},
	methods: {
		scroll(e) {
			this.scrollTop = e.detail.scrollTop;
		},
		callback() {
			if (this.$refs.indexPage) {
				this.$refs.indexPage.initPageIndex();
			}
		},
		//计算高度
		getHeight() {
			var self = this;
			//获取页面可用区域的高度
			uni.getSystemInfo({
				success: res => {
					this.pageHeight = res.screenHeight;
				}
			});
			// #ifdef MP || APP-PLUS
			this.$nextTick(() => {
				const query = uni.createSelectorQuery().in(this);
				query
					.select('.page-header')
					.boundingClientRect(data => {
						if (data) {
							this.headerHeight = data.height * 2 + 'rpx';
							// 从状态栏高度开始算
							this.paddingTop = data.height + 'px';
							this.marginTop = -data.height + 'px';
						}
					})
					.exec();
			});
			// #endif
			this.$nextTick(() => {
				const query = uni.createSelectorQuery().in(this);
				query
					.select('.page-bottom')
					.boundingClientRect(data => {
						this.bottomHeight = 110 + 'rpx';
					})
					.exec();
			});

		},
		getDiyInfo() {
			this.isLoad = false;
			this.$api.sendRequest({
				url: '/api/diyview/info',
				data: {
					name: this.name,
					is_default: this.isDefault
				},
				success: res => {
					if (res.code != 0 || !res.data) {
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						this.$util.showToast({
							title: '未配置自定义页面数据'
						});
						this.diyData = {};
						return;
					}

					let diyDatavalue = res.data;
					// console.log(JSON.parse(diyDatavalue.value))
					//处理后台组件input输入单引号问题 -- 英文状态下
					// diyDatavalue.value = diyDatavalue.value.replace(/\@/g, "'");
					if (diyDatavalue.value) {
						// uni.setStorageSync(this.name, diyDatavalue.value);
						this.diyData = JSON.parse(diyDatavalue.value);
						this.$langConfig.title(this.diyData.global.title);
						this.mpCollect = this.diyData.global.mpCollect;
						if (this.diyData.global.popWindow && this.diyData.global.popWindow.imageUrl) {
							// 弹框形式，首次弹出 1，每次弹出 0
							setTimeout(() => {
								if (this.diyData.global.popWindow.count == 1) {
									var popwindow_count = uni.getStorageSync(this.name +
										'_popwindow_count');
									if ((this.$refs.uniPopupWindow && popwindow_count == '') || (
											this.$refs.uniPopupWindow && popwindow_count == 1)) {
										this.$refs.uniPopupWindow.open();
										uni.setStorageSync(this.name + '_popwindow_count', 1);
									}
								} else if (this.diyData.global.popWindow.count == 0) {
									this.$refs.uniPopupWindow.open();
									uni.setStorageSync(this.name + '_popwindow_count', 0);
								}
							}, 500);
						}

						for (var i = 0; i < this.diyData.value.length; i++) {
							if (this.diyData.value[i].componentName == 'TopCategory') {
								this.topIndexValue = this.diyData.value[i];
								break;
							}
							// 关注公众号组件
							if (this.diyData.value[i].componentName == 'FollowOfficialAccount') {
								this.followOfficialAccount = this.diyData.value[i];
								break;
							}
						}

						// #ifdef MP
						//小程序收藏
						if (!uni.getStorageSync('isCollect') && this.diyData.global.mpCollect) {
							this.$refs.collectPopupWindow.open();
							this.showTip = true;
						}
						// #endif
					}

					if (!this.pullDownRefresh) {
						setTimeout(() => {
							this.$refs.diyGroup.refresh(this.diyData);
						});
						this.pullDownRefresh = true;
					}

					setTimeout(() => {
						uni.stopPullDownRefresh();
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						this.isLoad = true;
					}, 150);
				}
			});
		},
		closePopupWindow() {
			this.$refs.uniPopupWindow.close();
			uni.setStorageSync(this.name + '_popwindow_count', -1);
		},
		closeCollectPopupWindow() {
			this.$refs.collectPopupWindow.close();
			uni.setStorageSync('isCollect', true);
		},
		uniPopupWindowFn() {
			this.$util.diyRedirectTo(this.diyData.global.popWindow.link);
			this.closePopupWindow();
		}
	},
	onPageScroll(e) {
		if (this.$refs.topNav) {
			if (e.scrollTop >= 20) {
				this.$refs.topNav.navTopBg();
			} else {
				this.$refs.topNav.unSetnavTopBg();
			}
		}
	},
	onPullDownRefresh() {
		this.pullDownRefresh = false;
		if (uni.getStorageSync('token')) {
			this.$util.getMemberId().then(resolve => {
				this.memberId = resolve;
			});
		}
		this.store = uni.getStorageSync('store') ? uni.getStorageSync('store') : null;
		if (this.store) this.storeId = this.store.store_id;

		this.getDiyInfo();
		this.getHeight();

		//记录分享关系
		if (uni.getStorageSync('token') && uni.getStorageSync('source_member')) {
			this.$util.onSourceMember(uni.getStorageSync('source_member'));
		}

		//小程序分享
		// #ifdef MP-WEIXIN
		this.$util.getMpShare().then(res => {
			this.mpShareData = res;
		});
		// #endif
	},
	//分享给好友
	onShareAppMessage() {
		return this.mpShareData.appMessage;
	},
	//分享到朋友圈
	onShareTimeline() {
		return this.mpShareData.timeLine;
	}
}
