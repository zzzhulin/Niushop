<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view class="page">
		<view class="article-detail" v-if="articleDetail.article_content">
			<rich-text :nodes="articleDetail.article_content" :data-nodes="articleDetail.article_content"></rich-text>
		</view>
		<view class="contact-btn">
			<button type="primary" open-type="contact">联系客服</button>
		</view>
		<view class="tab-bar-placeholder"></view>
		<loading-cover ref="loadingCover"></loading-cover>
		<ns-login ref="login"></ns-login>
	</view>
</template>

<script>
	import htmlParser from '@/common/js/html-parser';
	export default {
		data() {
			return {
				articleDetail: {},
			}
		},
		onLoad(option) {
			this.getData();
		},
		methods: {
			getData() {
				this.$api.sendRequest({
					url: '/api/article/getCompanyGroupCardArticleInfo',
					data: {},
					success: res => {
						if (res.code >= 0) {
							this.articleDetail = res.data;
							this.articleDetail.article_content = htmlParser(this.articleDetail
								.article_content);
							if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						} else {
							this.$util.showToast({
								title: '未获取到文章信息！'
							});
						}
					},
					fail: res => {
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
		}
	}
</script>

<style lang="scss" scoped>
	.article-detail {
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		padding: 30rpx;
		margin-bottom: 120rpx;
	}
	.contact-btn{
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 0;
		background-color: #fff;
	}
	.tab-bar-placeholder {
		width: 100%;
		padding-bottom: calc(constant(safe-area-inset-bottom) + 130rpx);
		padding-bottom: calc(env(safe-area-inset-bottom) + 130rpx);
	}
</style>
