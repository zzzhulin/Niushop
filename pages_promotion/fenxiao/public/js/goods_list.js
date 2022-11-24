import { Weixin } from '@/common/js/wx-jssdk.js';
export default {
	data() {
		return {
			loadingType: 'loading', //加载更多状态
			goodsList: [], 
			isIphoneX: false,
			is_fenxiao: false,
			currIndex: 0,
			poster: '-1', //海报
			posterMsg: '' ,//海报错误信息
			shareUrl: '/pages_promotion/fenxiao/goods_list',
			shareType: 'goods'
		}
	},
	onLoad(options) {
		this.isIphoneX = this.$util.uniappIsIPhoneX();
	},
	methods: {
		//获取列表
		getGoodsList(mescroll) {
			this.$api.sendRequest({
				url: '/fenxiao/api/goods/page',
				data: {
					page: mescroll.num,
					page_size: mescroll.size
				},
				success: res => {
					let newArr = []
					let msg = res.message;
					if (res.code == 0 && res.data) {
						newArr = res.data.list;
					} else {
						this.$util.showToast({
							title: msg
						})
					}
					mescroll.endSuccess(newArr.length);
					//设置列表数据
					if (mescroll.num == 1) this.goodsList = []; //如果是第一页需手动制空列表
					this.goodsList = this.goodsList.concat(newArr); //追加新数据
					if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
				},
				fail: res => {
					//联网失败的回调
					mescroll.endErr();
					if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
				}
			});
		},
		//商品详情
		navToDetailPage(item) {
			this.$util.redirectTo('/pages/goods/detail', {
				goods_id: item.goods_id
			});
		},
		//查询会员信息
		getMemberInfo() {
			this.$api.sendRequest({
				url: '/api/member/info',
				data: {},
				success: res => {
					if (res.code == 0) this.is_fenxiao = Boolean(res.data.is_fenxiao);
					else this.is_fenxiao = false;
				}
			});
		},
		// 分享商品
		shareFn(type,keys){
			this.shareType = type;
			if(this.shareType == "fenxiao")
				this.openPosterPopup();
			else{
				this.currIndex = keys;
				this.$refs.sharePopup.open();
			}
		},
		// #ifdef MP-WEIXIN
		/**
		 * 将商品推荐到微信圈子
		 */
		openBusinessView() {
			if (wx.openBusinessView) {
				wx.openBusinessView({
					businessType: 'friendGoodsRecommend',
					extraData: {
						product: {
							item_code: this.goodsList[this.currIndex].goods_id,
							title: this.goodsList[this.currIndex].sku_name,
							image_list: this.$util.img(this.goodsList[this.currIndex].goods_image)
						}
					},
					success: function(res) {
						console.log('success', res);
					},
					fail: function(res) {
						console.log('fail', res);
					}
				})
			}
		},
		// #endif
		//-------------------------------------海报-------------------------------------
		// 打开海报弹出层
		openPosterPopup() {
			this.getGoodsPoster();
			this.$refs.sharePopup.close();
		},
		// 关闭海报弹出层
		closePosterPopup() {
			this.$refs.posterPopup.close();
		},
		//生成海报
		getGoodsPoster() {
			uni.showLoading({
				'title' : '海报生成中...'
			});
			let url = "";
			let data = {};
			if(this.shareType == "goods"){
				url = "/api/goods/poster";
				data.page = "/pages_promotion/fenxiao/goods_list";
				data.qrcode_param = JSON.stringify({goods_id: this.goodsList[this.currIndex].goods_id});
			}else{
				url = "/fenxiao/api/fenxiao/poster";
				// "/pages_promotion/fenxiao/goods_list";
				data.page = "/pages/index/index";
				data.qrcode_param = JSON.stringify({});
				data.template_id = this.templateId[0];
			}
			
			this.$api.sendRequest({
				url: url,
				data: data,
				success: res => {
					if (res.code == 0) {
						this.poster = res.data.path + "?time=" + new Date().getTime();
						this.$refs.posterPopup.open();
					} else {
						this.posterMsg = res.message;
					}
					uni.hideLoading();
				},
				fail: err => {
					uni.hideLoading();
				}
			});
		},
		// #ifdef MP || APP-PLUS
		//小程序中保存海报
		saveGoodsPoster() {
			let url = this.$util.img(this.poster);
			uni.downloadFile({
				url: url,
				success: (res) => {
					if (res.statusCode === 200) {
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => {
								this.$util.showToast({
									title: "保存成功"
								});
							},
							fail: () => {
								this.$util.showToast({
									title: "保存失败，请稍后重试"
								});
							}
						});
					}
				}
			});
		},
		// #endif
		// 打开分享弹出层
		openSharePopup() {
			this.$refs.sharePopup.open();
		},
		// 关闭分享弹出层
		closeSharePopup() {
			this.$refs.sharePopup.close();
		},
		copyUrl() {
			let text = this.$config.h5Domain + this.shareUrl;
			this.$util.copy(text, () => {
				this.closeSharePopup();
			});
		},
		imageError(index) {
			this.goodsList[index].sku_image = this.$util.getDefaultImage().goods;
			this.$forceUpdate();
		}
	},
	/**
	 * 自定义分享内容
	 * @param {Object} res
	 */
	onShareAppMessage(res) {
		var path = this.shareUrl;
		return {
			title: this.goodsSkuDetail.sku_name,
			imageUrl: this.$util.img(this.goodsList[this.currIndex].goods_image, {size: 'big'}),
			path: path,
			success: res => {},
			fail: res => {}
		};
	}
}
