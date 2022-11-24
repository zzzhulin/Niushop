<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view>
		<mescroll-uni ref="mescroll" @getData="getData" class="member-point">
			<view slot="list">
				<block v-if="dataList.length">
					<view>

						<!-- 门店列表 -->
						<view class="store-list">
							<view class="list-content-box">
								<view class="store-item" @click="storeTap(store)"  v-if="storeId && dataList">
									<view class="store-img">
										<image :src="$util.img(store.store_image)" mode="aspectFit" v-if="store.store_image"></image>
										<image :src="$util.getDefaultImage().store" mode="aspectFit" v-else></image>
									</view>
									<view class="store-content">
										<view class="content-title">{{ store.store_name }}</view>
										<view class="content-time" v-if="store.open_date">营业时间：{{ store.open_date }}
										</view>
										<view class="content-address">地址: {{ store.full_address + store.address }}
										</view>
									</view>
									<view class="store-bottom" @click.stop="selectStore(store)">
										<view class="store-icon"  v-if="store.distance">
											<text class="iconfont icon-dizhi distance-icon"></text>
											<text class="distance">
												距您当前位置{{ store.distance > 1 ? store.distance + 'km' : store.distance * 1000 + 'm' }}
											</text>
										</view>
										<view class="store-right">
											<text class="detail">详情</text>
											<text class="iconfont icon-right"></text>
										</view>
									</view>
								</view>
								<block v-for="(item, index) in dataList" :key="index">
									<view class="store-item" @click="storeTap(item)" v-if="store.store_id != item.store_id">
										<view class="store-img">
											<image :src="$util.img(item.store_image)" mode="aspectFit" v-if="item.store_image"></image>
											<image :src="$util.getDefaultImage().store" mode="aspectFit" v-else></image>
										</view>
										<view class="store-content">
											<view class="content-title">{{ item.store_name }}</view>
											<view class="content-time" v-if="item.open_date">营业时间：{{ item.open_date }}
											</view>
											<view class="content-address">地址: {{ item.full_address + item.address }}
											</view>
										</view>
										<view class="store-bottom" @click.stop="selectStore(item)">
											<view class="store-icon"  v-if="item.distance">
												<text class="iconfont icon-dizhi"></text>
												<text class="distance">
													距您当前位置{{ item.distance > 1 ? item.distance + 'km' : item.distance * 1000 + 'm' }}
												</text>
											</view>
											<view class="store-right">
												<text class="detail">详情</text>
												<text class="iconfont icon-right"></text>
											</view>
										</view>
									</view>
								</block>
							</view>
						</view>
					</view>
				</block>
				<block v-else>
					<ns-empty text="您的附近暂无可选门店" :isIndex="false"></ns-empty>
				</block>
			</view>
		</mescroll-uni>
		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
	export default {
		components: {},
		data() {
			return {
				searchText: '',
				dataList: [],
				isNetwork: 1, //是否可以继续请求
				isAll: false,
				latitude: null, // 纬度
				longitude: null, // 经度
				store: {},
				storeId: 0,
				isIphoneX: false
			};
		},
		onLoad() {
			this.isIphoneX = this.$util.uniappIsIPhoneX();
			this.store = uni.getStorageSync('store') ? uni.getStorageSync('store') : {};
			if (this.store) this.storeId = this.store.store_id;

			if (this.location) {
				this.latitude = this.location.latitude;
				this.longitude = this.location.longitude;
			} else {
				this.$util.getLocation();
			}
		},
		computed: {
			location() {
				return this.$store.state.location;
			}
		},
		watch: {
			location: function(nVal) {
				if (nVal) {
					this.latitude = nVal.latitude;
					this.longitude = nVal.longitude;
					this.$refs.mescroll.refresh();
				}
			}
		},
		methods: {
			navigateBack() {
				this.$util.redirectTo('/pages/index/index');
			},
			search() {},
			getData(mescroll) {
				if (!this.isNetwork) {
					mescroll.endSuccess(0);
					return;
				}
				if (this.isAll) {
					mescroll.endSuccess(0);
					return;
				}
				this.isNetwork = 0;
				let data = {
					page: mescroll.num,
					page_size: mescroll.size
				};
				if (this.latitude && this.longitude) {
					data.latitude = this.latitude;
					data.longitude = this.longitude;
				}

				this.$api.sendRequest({
					url: '/api/store/page',
					data: data,
					success: res => {
						this.isNetwork = 1;
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						let newArr = [];
						let msg = res.message;
						if (res.code == 0 && res.data) {
							newArr = res.data.list;
						} else {
							this.$util.showToast({
								title: msg
							});
						}
						mescroll.endSuccess(newArr.length);
						//设置列表数据
						if (mescroll.num == 1) this.dataList = []; //如果是第一页需手动制空列表
						this.dataList = this.dataList.concat(newArr); //追加新数据
						if (this.dataList.length == res.data.count) {
							this.isAll = true;
						}
					},
					fail: res => {
						mescroll.endErr();
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
			//获取门店详情
			getInfo() {
				let data = {
					store_id: this.storeId
				};
				if (this.latitude && this.longitude) {
					data.latitude = this.latitude;
					data.longitude = this.longitude;
				}
				this.$api.sendRequest({
					url: '/api/store/info',
					data: data,
					success: res => {
						if (res.data) {
							this.store = res.data;
							uni.setStorageSync('store', this.store);
						}
					}
				});
			},
			storeTap(item) {
				uni.setStorageSync('store', item);
				this.$util.redirectTo('/pages/index/index');
			},
			selectStore(item) {
				uni.setStorageSync('store', item);
				this.$util.diyRedirectTo({
					store_id: item.store_id,
					wap_url: '/pages_tool/index/diy?name=' + 'DIY_STORE'
				});
			}
		}
	};
</script>

<style lang="scss">
	.store-list {
		padding: 30rpx 30rpx 0;
		box-sizing: border-box;

		.list-content-box {
			width: 100%;
			height: 100%;
			box-sizing: border-box;

			.list-title {
				font-size: 30rpx;
				color: $color-title;
				font-weight: 500;
				line-height: 1;
				margin: 52rpx 0 24rpx;
				text-align: center;
			}

			.store-item {
				padding: 30rpx 24rpx;
				box-sizing: border-box;
				background-color: #fff;
				border-radius: 15rpx;
				display: flex;
				flex-wrap: wrap;
				margin-top: 20rpx;
				&:first-of-type{
					margin-top: 0;
				}
			}

			.store-img {
				width: 170rpx;
				height: 170rpx;
				border-radius: 20rpx;
				overflow: hidden;
				flex-shrink: 0;
				image {
					width: 170rpx;
					height: 170rpx;
				}
			}

			.store-content {
				flex: 1;
				margin-left: 14rpx;
			}

			.content-title {
				font-size: 30rpx;
				color: rgb(89, 89, 89);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-weight: 600;
				margin-bottom: 12rpx;
				line-height: 1.5;
			}

			.content-time {
				line-height: 1.3;
				margin-bottom: 8rpx;
				font-size: $font-size-tag;
				color: rgb(89, 89, 89);
			}

			.content-address {
				line-height: 1.3;
				font-size: $font-size-tag;
				color: rgb(89, 89, 89);
			}

			.store-bottom {
				width: 100%;
				display: flex;
				margin-top: 12rpx;
				.store-right{
					margin-left: auto;
					.iconfont {
						font-size: $font-size-tag;
						color: var(--base-color);
					}
					.detail {
						font-size: $font-size-tag;
						color: var(--base-color);
					}
				}
			}

			.distance-icon {
				line-height: 1;
				font-size: $font-size-tag;
				color: $color-tip;
				margin-bottom: 36rpx;
				font-size: 16px;
			}

			.distance {
				line-height: 1;
				font-size: $font-size-tag;
				color: rgb(89, 89, 89);
				margin-bottom: 36rpx;
				margin-left: 10rpx;
			}
		}
	}
</style>
