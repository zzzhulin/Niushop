<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view :style="{ backgroundColor: bgColor, minHeight: openBottomNav ? 'calc(100vh - 55px)' : '' }" class="page-img">
		<!-- #ifndef H5 -->
		<view class="page-header" v-if="diyData.global && diyData.global.navBarSwitch" :style="{ backgroundImage: bgImg }">
			<ns-navbar :background="bgNav" :title-color="textNavColor" :globalS="diyData.global" :scrollTop="scrollTop"></ns-navbar>
		</view>
		<!-- #endif -->

		<diy-index-page ref="indexPage" :value="topIndexValue" :scrollHeight="scrollHeight" :scrollTopHeight="scrollTopHeight" :bgUrl="bgUrl" v-if="topIndexValue">
			<diy-group ref="diyGroup" v-if="diyData.value" :diyData="diyData" :storeId="storeId" :height="scrollTopHeight" :token="storeToken"></diy-group>
			<view class="padding-bottom"><ns-copyright v-if="diyData.value && isLoad"></ns-copyright></view>
		</diy-index-page>

		<scroll-view v-else scroll-y="true" show-scrollbar="false" :style="{ height: openBottomNav ? 'calc(100vh - ' + headerHeight + ' - 55px)' : '' }" @scroll="scroll">
			<view class="bg-index" :style="{ backgroundImage: backgroundUrl, paddingTop: paddingTop, marginTop: marginTop }">
				<diy-group ref="diyGroup" v-if="diyData.value" :diyData="diyData" :storeId="storeId" :token="storeToken"></diy-group>
				<view class="padding-bottom"><ns-copyright v-if="diyData.value && isLoad"></ns-copyright></view>
			</view>
		</scroll-view>

		<template v-if="diyData.global && diyData.global.popWindow && diyData.global.popWindow.count != -1 && diyData.global.popWindow.imageUrl">
			<view @touchmove.prevent.stop>
				<uni-popup ref="uniPopupWindow" type="center" class="wap-floating" :maskClick="false">
					<view class="image-wrap">
						<image
							:src="$util.img(diyData.global.popWindow.imageUrl)"
							:style="popWindowStyle"
							@click="$util.diyRedirectTo(diyData.global.popWindow.link)"
							mode="aspectFit"
						></image>
					</view>
					<text class="iconfont icon-round-close" @click="closePopupWindow"></text>
				</uni-popup>
			</view>
		</template>

		<!-- ??????tabBar -->
		<view class="page-bottom" v-if="openBottomNav"><diy-bottom-nav @callback="callback"></diy-bottom-nav></view>

		<!-- ?????? -->
		<uni-popup ref="collectPopupWindow" type="top" class="wap-floating wap-floating-collect">
			<view v-if="showTip" class="collectPopupWindow" :style="{ marginTop: (collectTop + statusBarHeight) * 2 + 'rpx' }">
				<image :src="$util.img('public/uniapp/index/collect2.png')" mode="aspectFit"></image>
				<text @click="closeCollectPopupWindow">????????????</text>
			</view>
		</uni-popup>

		<ns-birthday-gift @getBirthday="getMemberInfo()" ref="birthdayGift"></ns-birthday-gift>
		<ns-new-gift @getData="getMemberInfo()" ref="nsNewGift"></ns-new-gift>
		<ns-login ref="login"></ns-login>
		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
import uniPopup from '@/components/uni-popup/uni-popup.vue';
import nsNavbar from '@/components/ns-navbar/ns-navbar.vue';
import diyJs from '@/common/js/diy.js';
import index from './public/js/index.js';
export default {
	components: {
		uniPopup,
		nsNavbar
	},
	mixins: [diyJs, index]
};
</script>

<style lang="scss">
@import '@/common/css/diy.scss';
</style>

<style scoped>
.wap-floating >>> .uni-popup__wrapper.uni-custom .uni-popup__wrapper-box {
	background: none !important;
}
/deep/ .placeholder {
	height: 0;
}
/deep/::-webkit-scrollbar {
	width: 0;
	height: 0;
	background-color: transparent;
	display: none;
}
/deep/ .ns-copyright-info {
	margin-top: 40rpx;
	margin-bottom: 0;
}
</style>
