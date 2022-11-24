<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view :style="{ backgroundColor: bgColor, minHeight: openBottomNav ? 'calc(100vh - 55px)' : '' }" class="page-img">
		<view class="site-info-box" v-if="$util.isWeiXin() && followOfficialAccount && followOfficialAccount.isShow && wechatQrcode">
			<view class="site-info">
				<view class="img-box" v-if="siteInfo.logo_square"><image :src="$util.img(siteInfo.logo_square)" mode="aspectFill"></image></view>
				<view class="info-box" :style="{ color: '#ffffff' }">
					<text class="font-size-base">{{ siteInfo.site_name }}</text>
					<text>{{ followOfficialAccount.welcomeMsg }}</text>
				</view>
			</view>
			<view class="dite-button" @click="officialAccountsOpen">关注公众号</view>
		</view>

		<!-- #ifndef H5 -->
		<view class="page-header" v-if="diyData.global && diyData.global.navBarSwitch" :style="{ backgroundImage: bgImg }">
			<ns-navbar :background="bgNav" :title-color="textNavColor" :globalS="diyData.global" :scrollTop="scrollTop"></ns-navbar>
		</view>
		<!-- #endif -->

		<diy-index-page ref="indexPage" :value="topIndexValue" :scrollHeight="scrollHeight" :scrollTopHeight="scrollTopHeight" :bgUrl="bgUrl" v-if="topIndexValue">
			<diy-group ref="diyGroup" :diyData="diyData" :storeId="storeId" v-if="diyData.value" :height="scrollTopHeight"></diy-group>
			<view class="padding-bottom"><ns-copyright  v-if="diyData.value && isLoad"></ns-copyright></view>
		</diy-index-page>

		<scroll-view v-else scroll-y="true" show-scrollbar="false" :style="{ height: openBottomNav ? 'calc(100vh - ' + headerHeight + ' - 55px)' : '' }" @scroll="scroll">
			<view class="bg-index" :style="{ backgroundImage: backgroundUrl, paddingTop: paddingTop, marginTop: marginTop }">
				<diy-group ref="diyGroup" :diyData="diyData" v-if="diyData.value" :storeId="storeId"></diy-group>
				<view class="padding-bottom"><ns-copyright v-if="diyData.value && isLoad"></ns-copyright></view>
			</view>
		</scroll-view>

		<template v-if="diyData.global && diyData.global.popWindow && diyData.global.popWindow.count != -1 && diyData.global.popWindow.imageUrl">
			<view @touchmove.prevent.stop>
				<uni-popup ref="uniPopupWindow" type="center" class="wap-floating" :maskClick="false">
					<view class="image-wrap">
						<image :src="$util.img(diyData.global.popWindow.imageUrl)" :style="popWindowStyle" @click="uniPopupWindowFn()" mode="aspectFit"></image>
					</view>
					<text class="iconfont icon-round-close" @click="closePopupWindow"></text>
				</uni-popup>
			</view>
		</template>

		<!-- 底部tabBar -->
		<view class="page-bottom" v-if="openBottomNav"><diy-bottom-nav @callback="callback" :name="name"></diy-bottom-nav></view>

		<!-- 收藏 -->
		<uni-popup ref="collectPopupWindow" type="top" class="wap-floating wap-floating-collect">
			<view v-if="showTip" class="collectPopupWindow" :style="{ marginTop: (collectTop + statusBarHeight) * 2 + 'rpx' }">
				<image :src="$util.img('public/uniapp/index/collect2.png')" mode="aspectFit"></image>
				<text @click="closeCollectPopupWindow">我知道了</text>
			</view>
		</uni-popup>

		<!-- 关注公众号弹窗 -->
		<view @touchmove.prevent class="official-accounts-inner" v-if="wechatQrcode">
			<uni-popup ref="officialAccountsPopup" type="center">
				<view class="official-accounts-wrap">
					<image class="content" :src="$util.img(wechatQrcode)" mode="aspectFit"></image>
					<text class="desc">关注了解更多</text>
					<text class="close iconfont icon-round-close" @click="officialAccountsClose"></text>
				</view>
			</uni-popup>
		</view>

		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
import uniPopup from '@/components/uni-popup/uni-popup.vue';
import nsNavbar from '@/components/ns-navbar/ns-navbar.vue';
import diyJs from '@/common/js/diy.js';
import indexJs from './public/js/index.js';

export default {
	components: {
		uniPopup,
		nsNavbar
	},
	mixins: [diyJs, indexJs]
};
</script>

<style lang="scss">
@import '@/common/css/diy.scss';
@import './public/css/index.scss';
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
