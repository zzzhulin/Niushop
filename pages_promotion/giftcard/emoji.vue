<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view class="page" v-if="cardInfo">

		<view class="bg-box">
			<image class="card-img" :src="$util.img('public/static/img/default_img/image_top_bg.png')" mode="widthFix">
			</image>

			<view class="card-box">
				<view class="card-title">
					<block v-if="!no">
						<text class="line"></text>
						<text class="company-name">{{cardInfo.event_name||'公司礼品卡专场'}}</text>
						<text class="line line-right"></text>
					</block>
					<block v-else><text class="placeholder"></text></block>
				</view>
				<view class="member-info">
					<view class="headimg">
						<image
							:src="$util.img(cardInfo.member_headimg ? cardInfo.member_headimg : $util.getDefaultImage().head)"
							@error="cardInfo.member_headimg = $util.getDefaultImage().head" mode="aspectFill"></image>
					</view>
					<view class="member">
						<text>{{cardInfo.member_nickname}}</text>
						<text>送出的神秘礼品卡</text>
					</view>
				</view>

				<view class="desc">{{cardInfo.blessing||'赠你一份好礼，祝你每天都开心快乐！'}}</view>
				<view class="emoji">
					<image :src="$util.img(cardInfo.expression_path)" mode="widthFix"
						v-if="cardInfo.expression_type==1"></image>
					<video :src="$util.img(cardInfo.video_url)" muted autoplay loop show-mute-btn controls
						v-if="cardInfo.expression_type==2"></video>
				</view>
				<view class="margin-placeholder" v-if="no"></view>
			</view>
		</view>
		<block>
			<view class="btn-home"
				:style="{backgroundImage:'url('+$util.img('public/static/img/default_img/icon_home.png')+')'}"
				@click="$util.redirectTo('/pages/index/index')">

			</view>
		</block>
		<block>
			<button class="btn" type="primary"
				:style="{backgroundImage:'url('+$util.img('public/static/img/default_img/image_chai.png')+')'}"
				@click="open()"></button>
		</block>

		<view @touchmove.prevent.stop>
			<uni-popup ref="phonePopup" type="center">
				<view class="card-popup-layer popup-layer">
					<view class="content">
						<view class="title">输入手机号查询领取资格</view>
						<view class="form">
							<input class="input" type="number" placeholder-class="input-placeholder"
								placeholder="输入你在公司通讯录的电话" v-model="mobile" />
						</view>
					</view>
					<view class="button-box">
						<view class="default-btn" @click="closePhonePopup()">取消</view>
						<view class="primary-btn" @click="verifyPhone()">确定</view>
					</view>
				</view>
			</uni-popup>
		</view>

		<view @touchmove.prevent.stop>
			<uni-popup ref="codePopup" type="center">
				<view class="card-popup-layer popup-layer">
					<view class="content">
						<view class="title">是的，有一份礼物待领取</view>
						<view class="form">
							<input class="input" type="number" placeholder-class="input-placeholder"
								placeholder="输入验证码领取礼品" v-model="code" />
							<view class="dynacode" @click="sendMobileCode">{{ dynacodeData.codeText }}</view>
						</view>
					</view>
					<view class="button-box">
						<view class="default-btn" @click="closeCodePopup()">取消</view>
						<view class="primary-btn" @click="verifyCode()">确定</view>
					</view>
				</view>
			</uni-popup>
		</view>

		<view @touchmove.prevent.stop>
			<uni-popup ref="notFoundPopup" type="center">
				<view class="card-popup-layer popup-layer">
					<view class="content">
						<view class="title">抱歉，没有查询到该手机号</view>
					</view>
					<view class="button-box">
						<view class="primary-btn" @click="closeNotFoundPopup()">知道了</view>
					</view>
				</view>
			</uni-popup>
		</view>

		<ns-login ref="login"></ns-login>
	</view>
</template>

<script>
	export default {
		components: {},
		data() {
			return {
				memberId: 0,
				no: 0,
				giftcard_id: 0,
				cardInfo: null,
				mobile: '',
				code: '',
				dynacodeData: {
					seconds: 120,
					timer: null,
					codeText: '获取验证码',
					isSend: false
				},
			};
		},
		computed: {

		},
		onLoad(option) {
			//小程序分享接收source_member
			if (option.source_member) {
				uni.setStorageSync('source_member', option.source_member);
				this.memberId = option.source_member
			}
			if (option.no) this.no = option.no;
			if (option.giftcard_id) this.giftcard_id = option.giftcard_id;
			// 小程序扫码进入，接收source_member
			if (option.scene) {
				var sceneParams = decodeURIComponent(option.scene);
				sceneParams = sceneParams.split('&');
				if (sceneParams.length) {
					sceneParams.forEach(item => {
						if (item.indexOf('no') != -1) this.no = item.split('-')[1];
						if (item.indexOf('giftcard_id') != -1) this.giftcard_id = item.split('-')[1];
					});
				}
			}

		},
		onShow() {
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
			this.getData();
		},
		//分享给好友
		onShareAppMessage() {
			return this.mpShareData.appMessage;
		},
		//分享到朋友圈
		onShareTimeline() {
			return this.mpShareData.timeLine;
		},
		methods: {
			goToGiveInfo() {
				var path = '/pages_promotion/giftcard/give_info?no=' + this.no;
				if (this.memberId) path += '&source_member=' + this.memberId;
				this.$util.redirectTo(path);
			},
			open() {
				if (!uni.getStorageSync('token')) {
					var url = '/pages_promotion/giftcard/emoji?no=' + this.no;
					this.$refs.login.open(url);
				} else {
					if (this.no) {
						this.goToGiveInfo();
					} else {
						this.openPhonePopup()
					}
				}
			},
			openPhonePopup() {
				this.$refs.phonePopup.open();
			},
			closePhonePopup() {
				this.mobile = ''
				this.$refs.phonePopup.close();
			},
			openCodePopup() {
				this.$refs.codePopup.open();
			},
			closeCodePopup() {
				this.code = ''
				this.$refs.codePopup.close();
			},
			openNotFoundPopup() {
				this.$refs.notFoundPopup.open();
			},
			closeNotFoundPopup() {
				this.$refs.notFoundPopup.close();
			},
			getData() {
				const url = this.no ? '/giftcard/api/transfer/blessingdetail' : '/giftcard/api/giftcard/detail';
				const data = this.no?{no:this.no}:{giftcard_id : this.giftcard_id}
				this.$api.sendRequest({
					url,
					data,
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
						}
					},
					fail: res => {
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
			sendMobileCode() {
				if (this.dynacodeData.seconds != 120) return;
				if (this.dynacodeData.isSend) return;
				this.dynacodeData.isSend = true;
				const data = {
					mobile: this.mobile,
					giftcard_id: this.cardInfo.giftcard_id
				}

				this.$api.sendRequest({
					url: '/giftcard/api/giftcard/mobileCode',
					data,
					success: res => {
						this.dynacodeData.isSend = false;
						if (res.code >= 0) {

							if (this.dynacodeData.seconds == 120 && this.dynacodeData.timer == null) {
								this.dynacodeData.timer = setInterval(() => {
									this.dynacodeData.seconds--;
									this.dynacodeData.codeText = this.dynacodeData.seconds + 's后可重新获取';
								}, 1000);
							}
						} else {
							this.$util.showToast({
								title: res.message
							});
						}
					},
					fail: () => {
						this.$util.showToast({
							title: 'request:fail'
						});
						this.dynacodeData.isSend = false;
					}
				});
			},
			verifyPhone() {
				const reg =
					/^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][0-9]))[0-9]{8}$/
				if (!this.mobile) {
					this.$util.showToast({
						title: '请填写手机号',
						mask: true,
						duration: 2000
					});
					return;
				}
				if (!reg.test(this.mobile)) {
					this.$util.showToast({
						title: '手机号不正确',
						mask: true,
						duration: 2000
					});
					return;
				}
				this.$api.sendRequest({
					url: '/giftcard/api/card/get_member_card_mobile',
					data: {
						mobile: this.mobile,
						giftcard_id: this.cardInfo.giftcard_id
					},
					success: res => {
						if (res.code >= 0) {
							this.closePhonePopup();
							if (res.data) {
								this.openCodePopup();
							} else {
								this.openNotFoundPopup()
							}

						} else {
							this.$util.showToast({
								title: res.message,
								mask: true,
								duration: 2000
							});
						}
					}
				});
			},
			verifyCode() {
				if (!this.code) {
					this.$util.showToast({
						title: '请填写验证码',
						mask: true,
						duration: 2000
					});
					return;
				}
				this.$api.sendRequest({
					url: '/giftcard/api/activate/mobile_activate',
					data: {
						mobile: this.mobile,
						giftcard_id: this.cardInfo.giftcard_id,
						code: this.code,
					},
					success: res => {
						if (res.code >= 0) {
							this.$util.redirectTo('/pages_promotion/giftcard/list')
						} else {
							this.$util.showToast({
								title: res.message,
								mask: true,
								duration: 2000
							});
						}
					}
				});
			},
		},
		watch: {
			'dynacodeData.seconds': {
				handler(newValue, oldValue) {
					if (newValue == 0) {
						clearInterval(this.dynacodeData.timer);
						this.dynacodeData = {
							seconds: 120,
							timer: null,
							codeText: '获取验证码',
							isSend: false
						};
					}
				},
				immediate: true,
				deep: true
			}
		},
	};
</script>

<style lang="scss" scoped>
	.page {
		position: relative;
		min-height: 100vh;
		padding-bottom: 112rpx;
		box-sizing: border-box;
		background: linear-gradient(0deg, #D95854 0%, #FF6363 77%);

		box-shadow: 0px 4px 10px 0px rgba(109, 42, 41, 0.3), inset 0px 0px 30px 0px rgba(53, 17, 17, 0.2);
	}

	.member-box {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 20rpx;

		image {
			width: 44rpx;
			height: 44rpx;
			border-radius: 6rpx;
		}

		view {
			font-size: 30rpx;
			margin-left: 10rpx;
		}

	}

	.card-img {
		display: block;
		width: 100%;
	}

	.card-title {
		font-size: 30rpx;
		color: #444444;
		display: flex;
		justify-content: center;

		>text {
			color: var(--price-color);
		}

	}

	.card-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 44rpx;

		.card-title {
			display: flex;
			align-items: center;
			justify-content: center;

			.company-name {
				margin: 0 16rpx;
				font-size: 32rpx;
				font-weight: normal;
				line-height: 48rpx;
				text-align: center;
				letter-spacing: 0rpx;
				color: #FFDDAD;
			}

			.line {
				position: relative;
				display: flex;
				align-items: center;
				width: 138rpx;
				height: 48rpx;

				&::before {
					content: '';
					position: absolute;
					left: 0rpx;
					width: 130rpx;
					height: 0rpx;
					opacity: 1;
					border: 2rpx solid #FFDDAD;
				}

				&::after {
					content: '';
					position: absolute;
					right: 0rpx;
					width: 8rpx;
					height: 8rpx;
					transform: rotate(45deg);
					border-radius: 2rpx;
					opacity: 1;
					background: #FFDDAD;
				}
			}

			.line-right {
				transform: rotate(180deg);
			}

			.placeholder {
				display: block;
				width: 100vw;
				height: 8rpx;
			}
		}

		.member-info {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-top: 68rpx;

			.headimg {
				width: 64rpx;
				height: 64rpx;
				display: flex;
				align-items: center;
				justify-content: center;

				image {
					width: 100%;
					max-height: 64rpx;
					border-radius: 50%;
				}
			}

			.member {
				margin-left: 16rpx;
				font-size: 40rpx;
				font-weight: normal;
				line-height: 56rpx;
				letter-spacing: 0rpx;
				color: #FFDDAD;
			}
		}

		.desc {
			margin-top: 16rpx;
			font-size: 28rpx;
			font-weight: normal;
			line-height: 44rpx;
			text-align: center;
			letter-spacing: 0rpx;
			color: #FFDDAD;
		}

		.emoji {
			display: flex;
			align-items: center;
			margin-top: 48rpx;
			margin-bottom: 86rpx;
			width: 480rpx;
			height: 480rpx;
			border-radius: 24rpx;
			opacity: 1;

			image,
			video {
				border-radius: 24rpx;
				height: 100%;
			}
		}

		.margin-placeholder {
			width: 100vw;
			height: 40rpx;
		}
	}

	.btn-home {
		position: absolute;
		left: 40rpx;
		bottom: 168rpx;
		width: 88rpx;
		height: 88rpx;
		opacity: 1;
		background-repeat: no-repeat;
	}

	.btn {
		padding: 0;
		margin: 0 auto;
		width: 100px;
		height: 100px;
		border-radius: 56px;
		opacity: 1;
	}

	.card-popup-layer {
		width: 600rpx;

		.content {
			padding: 64rpx 48rpx;
			box-sizing: border-box;
			border-bottom: 1rpx solid #E7E7E7;

			.title {
				font-size: 32rpx;
				font-weight: normal;
				line-height: 48rpx;
				text-align: center;
				letter-spacing: 0rpx;
				color: #242426;
			}

			.form {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-top: 32rpx;
				height: 96rpx;
				border-radius: 8rpx;
				padding: 16rpx 16rpx 16rpx 24rpx;
				opacity: 1;
				background: #F3F3F3;
				box-sizing: border-box;

				.input {
					flex: 1;
				}

				.input-placeholder {
					font-size: 32rpx;
					font-weight: normal;
					line-height: 48rpx;
					display: flex;
					align-items: center;
					letter-spacing: 0rpx;
					color: rgba(0, 0, 0, 0.26);
				}

				.dynacode {
					flex: none;
					width: 176rpx;
					height: 64rpx;
					border-radius: 8rpx;
					opacity: 1;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					padding: 0rpx 8rpx;
					background: #EBAB6F;
					font-size: 32rpx;
					font-weight: normal;
					line-height: 48rpx;
					letter-spacing: 0rpx;
					color: #FFFFFF;
				}
			}
		}

		.button-box {
			height: 112rpx;
			opacity: 1;
			display: flex;
			flex-direction: row;
			justify-content: center;
			align-items: center;

			.primary-btn,
			.default-btn {
				flex: 1;
				font-size: 32rpx;
				font-weight: normal;
				height: 112rpx;
				line-height: 112rpx;
				text-align: center;
				letter-spacing: 0rpx;

			}

			.primary-btn {
				color: #E49953;
			}

			.default-btn {
				color: #242426;
				border-right: 1rpx solid #E7E7E7;
			}
		}
	}
</style>
