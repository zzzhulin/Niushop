<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view class="page">
		<view class="detail-box">
			<view class="title">文字祝福<text>(自定义)</text></view>
			<view class="textarea">
				<textarea maxlength="15" placeholder="赠你一份好礼，祝你每天都开心快乐！" v-model="message"
					placeholder-style="font-size:28rpx;color:#999999"></textarea>
			</view>
			<view class="title">表情包<text>(自定义)</text></view>
			<view class="other-info">
				<view class="other-info-box" v-if="src">
					<image :src="$util.img(src)" mode="aspectFill" @click="preview" v-if="type=='image'"></image>
					<video :src="$util.img(src)" v-else></video>
					<view class="emojiDel" @click="del"><text class=" icon iconfont icon-delete"></text>
					</view>
				</view>
				<view class="other-info-box active" @click="openUploadPopup" v-else>
					<text class="icon iconfont icon-jia"></text>
				</view>
			</view>

			<view class="bottom-btn">
				<button type="primary" @click="openSharePopup">送给朋友</button>
				<button @click="$util.redirectTo('/pages_promotion/giftcard/list')">放入卡包</button>
			</view>
		</view>
		<ns-login ref="login"></ns-login>

		<!-- 分享弹窗 -->
		<view @touchmove.prevent.stop>
			<uni-popup ref="sharePopup" type="bottom" class="share-popup">
				<view>
					<view class="share-title">分享</view>
					<view class="share-content">
						<!-- #ifdef MP -->
						<view class="share-box">
							<button class="share-btn" :plain="true" open-type="share">
								<view class="iconfont icon-share-friend"></view>
								<text>分享给好友</text>
							</button>
						</view>
						<!-- #endif -->
						<!-- #ifdef H5 -->
						<view class="share-box" v-if="$util.isWeiXin()">
							<button class="share-btn" @click="maskShow()" :plain="true">
								<view class="iconfont icon-share-friend"></view>
								<text>分享给好友</text>
							</button>
						</view>

						<view class="share-box" @click="copyUrl">
							<button class="share-btn" :plain="true">
								<view class="iconfont icon-fuzhilianjie"></view>
								<text>复制链接</text>
							</button>
						</view>
						<!-- #endif -->
						<view class="share-box" @click="openPosterPopup">
							<button class="share-btn" :plain="true">
								<view class="iconfont icon-pengyouquan"></view>
								<text>生成分享海报</text>
							</button>
						</view>
					</view>
					<view class="share-footer" @click="closeSharePopup"><text>取消分享</text></view>
				</view>
			</uni-popup>
		</view>

		<!-- 海报 -->
		<view @touchmove.prevent.stop>
			<uni-popup ref="posterPopup" type="bottom" class="poster-layer">
				<template v-if="poster != '-1'">
					<view>
						<view class="image-wrap">
							<image :src="$util.img(poster)" :show-menu-by-longpress="true" />
						</view>
						<!-- #ifdef MP || APP-PLUS  -->
						<view class="save" @click="saveGoodsPoster()">保存图片</view>
						<!-- #endif -->
						<!-- #ifdef H5 -->
						<view class="save">长按保存图片</view>
						<!-- #endif -->
					</view>
					<view class="close iconfont icon-close" @click="closePosterPopup()"></view>
				</template>
				<view v-else class="msg">{{ posterMsg }}</view>
			</uni-popup>

			<!-- 分享指示弹出 -->
			<view class="wechat-share" v-if="shareMask" @click="shareMask = false">

				<image :src="$util.img('public/uniapp/giftcard/wechat_share.png')" mode="widthFix"></image>
			</view>

		</view>
	</view>
</template>

<script>
	import Config from '@/common/js/config.js'
	export default {
		components: {},
		data() {
			return {
				src: '',
				type: '',
				typeList: ['image', 'video'],
				memberCardId: 0,
				cardInfo: null,
				message: '',
				memberId: 0,
				token: null,
				poster: "-1", //海报
				posterMsg: "", //海报错误信息
				posterHeight: 0,
				no: '',
				shareMask: false,
			};
		},
		onLoad(option) {
			if (option.member_card_id) this.memberCardId = option.member_card_id;
			// 小程序扫码进入，接收source_member
			if (option.scene) {
				var sceneParams = decodeURIComponent(option.scene);
				sceneParams = sceneParams.split('&');
				if (sceneParams.length) {
					sceneParams.forEach(item => {
						if (item.indexOf('member_card_id') != -1) this.memberCardId = item.split('-')[1];
					});
				}
			}
		},
		onShow() {
			if (uni.getStorageSync('token')) {
				this.$util.getMemberId().then(resolve => {
					this.memberId = resolve;
					this.token = uni.getStorageSync('token');
				});
			}
			this.getData();
		},
		methods: {
			getData() {
				this.$api.sendRequest({
					url: '/giftcard/api/membercard/detail',
					data: {
						'member_card_id': this.memberCardId
					},
					success: res => {
						if (res.code >= 0) {
							this.cardInfo = res.data;

							if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						} else {
							this.$util.showToast({
								title: res.message,
								mask: true,
								duration: 2000
							});
							setTimeout(() => {
								this.$util.redirectTo('/pages_promotion/giftcard/member');
							}, 1500)
						}
					},
					fail: res => {
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
			openUploadPopup() {
				uni.showActionSheet({
					itemList: ['图片', '视频'],
					success: (res) => {
						this.type = this.typeList[res.tapIndex];
						this.add();
					},
					fail: (res) => {
						console.log(res.errMsg);
					}
				});
			},
			// 添加表情包
			add() {
				const self = this;
				console.log(self.type)
				if (self.type === 'video') {
					uni.chooseVideo({
						sourceType: ['camera', 'album'],
						success: async (res) => {
							uni.showLoading({
								title: '视频上传中'
							})
							self.src = await self.upload(res.tempFilePath);

						}
					});
				} else {
					uni.chooseImage({
						count: 1,
						sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
						sourceType: ['album'], //从相册选择
						success: async (res) => {
							uni.showLoading({
								title: '图片上传中'
							})
							self.src = await self.upload(res.tempFilePaths[0]);
						}
					});
				}

			},
			//删除表情包
			del() {
				this.src = ''
			},
			// 图片预览
			preview() {
				uni.previewImage({
					urls: [this.src],
				});
			},
			upload(tempFilePath) {
				const self = this;
				// #ifdef H5
				var app_type = self.isWeiXin() ? 'wechat' : 'h5';
				var app_type_name = self.isWeiXin() ? '微信公众号' : 'H5';
				// #endif

				// #ifdef MP-WEIXIN
				var app_type = 'weapp';
				var app_type_name = '微信小程序';
				// #endif

				// #ifdef MP-ALIPAY
				var app_type = 'aliapp';
				var app_type_name = '支付宝小程序';
				// #endif

				// #ifdef MP-BAIDU
				var app_type = 'baiduapp';
				var app_type_name = '百度小程序';
				// #endif

				// #ifdef MP-TOUTIAO
				var app_type = 'MP-TOUTIAO';
				var app_type_name = '头条小程序';
				// #endif

				// #ifdef MP-QQ
				var app_type = 'MP-QQ';
				var app_type_name = 'QQ小程序';
				// #endif
				var data = {
					token: uni.getStorageSync('token'),
					app_type: app_type,
					app_type_name: app_type_name
				}
				data = Object.assign(data, {
					type: self.type
				});
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: Config.baseUrl + '/api/upload/giftcard',
						filePath: tempFilePath,
						name: 'file',
						formData: data,
						success: function(res) {
							var result = JSON.parse(res.data);
							if (result.code >= 0) {
								uni.hideLoading()
								uni.showToast({
									title: '上传成功',
									icon: 'none'
								})
								const path = self.type === 'video' ? result.data.path : result.data
									.pic_path;
								resolve(path);
							} else {
								reject("error");
							}
						}
					});

				});
			},
			maskShow() {
				this.shareMask = true
				this.closeSharePopup();
			},
			// 打开分享弹出层
			openSharePopup() {
				let that = this;
				let data = {
					'member_card_id': that.memberCardId,
					'blessing': that.message ? that.message : '赠你一份好礼，祝你每天都开心快乐！',
				}
				if (that.src) {
					if (that.type === 'image') {
						data = Object.assign(data, {
							'expression_path': that.src,
							'expression_type': 1
						})
					} else {
						data = Object.assign(data, {
							'video_url': that.src,
							'expression_type': 2
						})
					}
				}
				this.$api.sendRequest({
					url: '/giftcard/api/membercard/blessing',
					data,
					success: res => {
						if (res.code >= 0) {
							that.no = res.data.no;
							that.$refs.sharePopup.open();
							that.setPublicShare();
						} else {
							that.$util.showToast({
								title: res.message,
							});
						}

					},
					fail: err => {
						console.log(err)
					}
				});

			},
			// 关闭分享弹出层
			closeSharePopup() {
				this.$refs.sharePopup.close();
			},
			copyUrl() {
				let text = '嘿！朋友送你一张礼品卡，快来领取吧~' + this.$config.h5Domain + '/pages_promotion/giftcard/emoji?no=' + this
					.no;
				if (this.memberId) text += '&source_member=' + this.memberId;
				this.$util.copy(text, () => {
					this.closeSharePopup();
				});
			},
			//-------------------------------------海报-------------------------------------
			// 打开海报弹出层
			openPosterPopup() {
				this.getGoodsPoster();
				this.$refs.sharePopup.close();
				this.$refs.posterPopup.open();
				if (this.poster != '-1') {
					setTimeout(() => {
						let view = uni.createSelectorQuery().in(this).select(".poster-layer .image-wrap");
						view.fields({
							size: true,
						}, data => {
							let posterWhith = data.width;
							let ratio = parseFloat((740 / posterWhith).toFixed(2));
							if (this.token != '') {
								this.posterHeight = parseInt(1240 / ratio);
							} else {
								this.posterHeight = parseInt(1100 / ratio);
							}
						}).exec();
					}, 100);
				}
			},
			// 关闭海报弹出层
			closePosterPopup() {
				this.$refs.posterPopup.close();
			},
			/**
			 * 获取海报
			 */
			getGoodsPoster() {
				uni.showLoading({
					'title': '海报生成中...'
				})
				//活动海报信息
				let posterParams = {
					no: this.no
				};

				if (this.memberId) posterParams.source_member = this.memberId;

				this.$api.sendRequest({
					url: '/giftcard/api/membercard/poster',
					data: {
						page: '/pages_promotion/giftcard/emoji',
						qrcode_param: JSON.stringify(posterParams)
					},
					success: res => {
						if (res.code == 0) {
							this.poster = res.data.path + "?time=" + new Date().getTime();
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
			/**
			 * 设置公众号分享
			 */
			setPublicShare() {
				let shareUrl = this.$config.h5Domain + '/pages_promotion/giftcard/emoji?no=' + this.no;
				if (this.memberId) shareUrl += '&source_member=' + this.memberId;

				this.$util.setPublicShare({
					title: this.cardInfo.card_name,
					desc: this.message ? this.message : '赠你一份好礼，祝你每天都开心快乐！',
					link: shareUrl,
					imgUrl: this.$util.img(this.cardInfo.card_cover.split(',')[0])
				}, res => {
					// console.log('公众号分享成功');
					// this.share();
				})
			},
		},
		/**
		 * 自定义分享内容
		 */
		onShareAppMessage() {
			let that = this;
			var path = '/pages_promotion/giftcard/emoji?no=' + this.no;
			if (this.memberId) path += '&source_member=' + this.memberId;
			return {
				title: `有人送你【礼品卡】并对你说：${this.message ? this.message : '赠你一份好礼，祝你每天都开心快乐！'}`,
				imageUrl: this.$util.img(this.cardInfo.card_cover.split(',')[0]),
				path: path,
				success: res => {
					this.$util.redirectTo('/pages_promotion/giftcard/give_list');
				},
				fail: res => {},
				complete: res => {}
			};
		}
	};
</script>

<style lang="scss" scoped>
	.page {
		background: #ffffff;
		min-height: 100vh;
	}

	.detail-box {
		padding: 30rpx 24rpx;

		.title {
			font-weight: bold;
			font-size: $font-size-toolbar;

			text {
				font-size: $font-size-sub;
				font-weight: 500;
				color: #999999;
				margin-left: 10rpx;
			}
		}

		.textarea {
			height: 180rpx;
			background: #F5F6F9;
			border-radius: 8rpx;
			padding: 24rpx;
			font-size: 24rpx;
			margin-top: 20rpx;
			margin-bottom: 30rpx;
			overflow: hidden;

			textarea {
				font-size: 28rpx;
				width: 100%;
				height: 100%;
			}
		}

		.other-info {
			width: 100%;
			box-sizing: border-box;
			display: flex;
			flex-wrap: wrap;
			margin-top: $margin-updown;
		}

		.other-info-box {
			width: 100%;
			height: 400rpx;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			position: relative;

			image {
				width: 100%;
				border-radius: $border-radius;
			}

			video {
				width: 100%;
			}

			.iconfont {
				font-size: 60rpx;
				color: #898989;
				line-height: 1;
			}

			text {
				line-height: 1;
			}

			.emojiDel {
				width: 40rpx;
				height: 40rpx;
				position: absolute;
				right: -20rpx;
				top: -20rpx;
				display: flex;
				justify-content: center;
				align-items: center;

				.iconfont {
					font-size: $font-size-toolbar;
				}
			}
		}

		.other-info-box.active {
			background-color: #F5F6F9;
			border-radius: 8rpx;
		}
	}

	.bottom-btn {
		margin-top: 120rpx;

		button {
			margin-bottom: 20rpx;
			border: 2rpx solid var(--main-color);

			&:last-child {
				color: var(--main-color);
				border: 2rpx solid var(--main-color);
				background-color: #ffffff;
			}
		}
	}

	.share-popup,
	.uni-popup__wrapper-box {
		.share-title {
			line-height: 60rpx;
			font-size: $font-size-toolbar;
			padding: 15rpx 0;
			text-align: center;
		}

		.share-content {
			display: flex;
			display: -webkit-flex;
			-webkit-flex-wrap: wrap;
			-moz-flex-wrap: wrap;
			-ms-flex-wrap: wrap;
			-o-flex-wrap: wrap;
			flex-wrap: wrap;
			padding: 15rpx;

			.share-box {
				flex: 1;
				text-align: center;

				.share-btn {
					margin: 0;
					padding: 0;
					border: none;
					line-height: 1;
					height: auto;

					text {
						margin-top: 20rpx;
						font-size: $font-size-tag;
						display: block;
						color: $color-title;
					}
				}

				.iconfont {
					font-size: 80rpx;
					line-height: initial;
				}

				.icon-fuzhilianjie,
				.icon-pengyouquan,
				.icon-haowuquan,
				.icon-share-friend {
					color: #07c160;
				}
			}
		}

		.share-footer {
			height: 90rpx;
			line-height: 90rpx;
			border-top: 2rpx #f5f5f5 solid;
			text-align: center;
			color: #666;
		}
	}

	.poster-layer {
		.generate-poster {
			padding: 40rpx 0;

			.iconfont {
				font-size: 80rpx;
				color: #07c160;
				line-height: initial;
			}

			>view {
				text-align: center;

				&:last-child {
					margin-top: 20rpx;
				}
			}
		}

		.image-wrap {
			width: 64%;
			height: 854rpx;
			margin: 60rpx auto 40rpx auto;
			box-shadow: 0 0 32rpx rgba(100, 100, 100, 0.3);

			image {
				width: 480rpx;
				height: 854rpx;
			}
		}

		.msg {
			padding: 40rpx;
		}

		.save {
			text-align: center;
			height: 80rpx;
			line-height: 80rpx;
		}

		.close {
			position: absolute;
			top: 0;
			right: 20rpx;
			width: 40rpx;
			height: 80rpx;
			font-size: 50rpx;
		}
	}

	.goods-details img {
		max-width: 100%;
	}

	.wechat-share {
		position: fixed;
		width: 100vw;
		height: 100vh;
		left: 0;
		top: 0;
		background-color: rgba(0, 0, 0, .6);

		image {
			width: 100%;
		}
	}
</style>
