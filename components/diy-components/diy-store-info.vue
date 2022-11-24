<template>
	<view class="store-info" v-if="store">
		<view class="store-info-top">
			<view class="info-image">
				<image :src="$util.img(store.store_image)" v-if="store.store_image" mode="aspectFit"></image>
				<image :src="$util.getDefaultImage().store" v-else></image>
			</view>
			<view class="info-desc">
				<view class="store-name">{{ store.store_name }}</view>
				<view class="item" v-if="store.open_date">
					<text>营业时间：</text>
					<text>{{ store.open_date }}</text>
				</view>
				<view class="item" v-if="store.telphone">
					<text>联系电话：</text>
					<text @click="phoneCall">{{ store.telphone }}</text>
				</view>
			</view>

			<!-- <text class="store-whole-country" @click="clearStore">
				全国
				<text class="iconfont icon-right"></text>
			</text> -->
		</view>
		<view class="store-map">
			<text>门店地图</text>
			<map class="map" :latitude="store.latitude" :longitude="store.longitude" :markers="covers"></map>
		</view>
		<view class="store-info-bottom" @click="mapRoute()" v-if="store.full_address || store.address">
			<view class="address-wrap">
				<view>{{ store.full_address + store.address }}</view>
				<text>距您当前位置{{ store.distance }}km</text>
			</view>
			<image :src="$util.img('addon/store/component/view/store_info/img/position.png')" />
		</view>
	</view>
</template>

<script>
import Map from '@/common/js/map/openMap.js';
export default {
	props: {
		value: {
			type: Object
		},
		storeId: {
			type: [String, Number],
			default: 0
		}
	},
	data() {
		return {
			store: null,
			covers: []
		};
	},
	computed: {
		// 定位信息
		location() {
			return this.$store.state.location;
		}
	},
	mounted() {
		if (this.location) {
			this.latitude = this.location.latitude;
			this.longitude = this.location.longitude;
		} else {
			this.$util.getLocation();
		}
		this.getInfo();
	},
	watch: {
		location: function(nVal) {
			if (nVal) {
				this.latitude = nVal.latitude;
				this.longitude = nVal.longitude;
				this.getInfo();
			}
		}
	},
	methods: {
		//打电话
		phoneCall() {
			uni.makePhoneCall({
				phoneNumber: this.store.telphone //仅为示例
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
						this.latitude = res.data.latitude;
						this.longitude = res.data.longitude;
						uni.setStorageSync('store', this.store);
					}
				}
			});
		},
		mapRoute() {
			Map.openMap(Number(this.latitude), Number(this.longitude), this.store_name, 'gcj02');
		},
		clearStore() {
			let _this = getCurrentPages()[getCurrentPages().length - 1];
			uni.setStorageSync('store', '');
			_this.refresh();
			this.$util.redirectTo('/pages/index/index');
		}
	}
};
</script>

<style lang="scss">
.store-info {
	width: 100%;
	box-sizing: border-box;
	.store-info-top {
		display: flex;
		align-items: flex-start;
		border-radius: 18rpx;
		background: #ffffff;
		padding: 20rpx 28rpx;
		margin-bottom: 32rpx;

		.info-image {
			width: 128rpx;
			height: 128rpx;
			float: left;
			margin-right: 20rpx;
			image {
				width: 100%;
				height: 100%;
				border-radius: 5px;
			}
		}
		.info-desc {
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			padding-left: 20rpx;
			box-sizing: border-box;
			width: 70%;
			.store-name {
				align-items: center;
				font-size: $font-size-toolbar;
				color: #2b2b2e;
				margin-bottom: 20rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				display: -webkit-box;
				-webkit-line-clamp: 1;
				-webkit-box-orient: vertical;
			}
			.item {
				font-size: $font-size-tag;
				margin-bottom: 20rpx;
				text:first-child {
					color: #333333;
				}
				text:last-child {
					color: #666666;
				}
			}
		}

		.store-whole-country {
			text {
				font-size: 26rpx;
				color: #666666;
			}
		}
	}

	.store-map {
		margin: 16px 0;
		text {
			color: #2b2b2e;
			margin-bottom: 10px;
			font-weight: bold;
			display: block;
			font-size: $font-size-toolbar;
		}
		.map {
			width: 100%;
			height: 450rpx;
		}
	}

	.store-info-bottom {
		background: #ffffff;
		padding: 20rpx 28rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		.address-wrap {
			flex: 1;
			view {
				margin-bottom: 8rpx;
				font-weight: bold;
			}
			text {
				color: #666666;
		font-size: $font-size-tag;
			}
		}
		image {
			width: 80rpx;
			height: 80rpx;
		}
	}
}
</style>
