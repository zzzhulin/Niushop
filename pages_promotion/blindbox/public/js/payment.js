export default {
	data() {
		return {
			isIphoneX: false,
			orderCreateData: {
				is_balance: 0,
				is_point: 1,
				buyer_message: '',

				// 发票
				is_invoice: 0, // 是否需要发票 0 无发票  1 有发票
				invoice_type: 1, // 发票类型  1 纸质 2 电子
				invoice_title_type: 1, // 抬头类型  1 个人 2 企业
				is_tax_invoice: 0, // 是否需要增值税专用发票  0 不需要 1 需要
				invoice_title: '', // 发票抬头
				taxpayer_number: '', // 纳税人识别号
				invoice_content: '', // 发票内容
				invoice_full_address: '', // 发票邮寄地址
				invoice_email: '', //发票邮箱
				member_address: {
					mobile: ''
				},
				is_open_card: 0,
				member_card_unit: ''
			},
			orderPaymentData: {
				shop_goods_list: {
					site_name: '',
					express_type: [],
					coupon_list: [],
					invoice: {
						invoice_content_array: []
					}
				},
				member_account: {
					balance: 0,
					is_pay_password: 0
				},
				delivery: {
					delivery_type: ''
				},
				member_address: {
					mobile: ''
				},
				local_config: {
					info: {
						start_time: 0,
						end_time: 0,
						time_week: []
					}
				},
				delivery_store_info: {
					
				}
			},
			isSub: false,
			tempData: null,
			manjian: [],
			// 门店信息
			storeInfo: {
				storeList: [], //门店列表
				currStore: {} //当前选择门店
			},
			// 自提地址
			member_address: {
				mobile: ''
			},
			// 当前时间
			timeInfo: {
				week: 0,
				start_time: 0,
				end_time: 0,
				showTime: false,
				showTimeBar: false
			},
			post_free : {},
			canLocalDelicery: true,
			deliveryWeek: "",
			out_trade_no: null,
			menuButtonBounding: {} ,// 小程序胶囊属性
			memberAddress: null, // 会员收货地址
			localMemberAddress: null // 会员本地配送收货地址
		};
	},
	onLoad(){
		if (!this.location) this.$util.getLocation();
		// #ifdef MP
		this.menuButtonBounding = uni.getMenuButtonBoundingClientRect();
		// #endif
		this.isIphoneX = this.$util.uniappIsIPhoneX();
			
		if (uni.getStorageSync('addressBack')) {
			uni.removeStorageSync('addressBack');
		}
		
		// 判断登录
		if (!uni.getStorageSync('token')) {
			this.$refs.login.open('/pages_promotion/blindbox/fill_address');
		} else {
			this.getOrderPaymentData();
		}
	},
	methods: {
		// 获取订单初始化数据
		getOrderPaymentData() {
			if (this.out_trade_no) return;
			
			this.orderCreateData = uni.getStorageSync('blindOrderCreateData');
			var pay_flag = uni.getStorageSync("pay_flag"); // 支付中标识，防止返回时，提示,跳转错误
			if (!this.orderCreateData) {
				if (pay_flag == 1) {
					uni.removeStorageSync("pay_flag");
				} else {
					this.$util.showToast({
					title: '未获取到创建订单所需数据！'
					});	
					setTimeout(() => {
						this.$util.redirectTo('/pages/index/index');
					}, 1500);
				}
				return;
			}

			// 获取经纬度
			if (this.location) {
				this.orderCreateData.latitude = this.location.latitude;
				this.orderCreateData.longitude = this.location.longitude;
			}
			
			this.$api.sendRequest({
				url: '/blindbox/api/order/payment',
				data: this.orderCreateData,
				success: res => {
					if (res.code >= 0) {
						this.orderPaymentData = res.data;
						this.handlePaymentData();
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					} else {
						this.$util.showToast({
							title: '未获取到创建订单所需数据！'
						});
						setTimeout(() => {
							this.$util.redirectTo('/pages/index/index');
						}, 1500);
					}
				},
				fail: res => {
					if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
				}
			})
		},
		// 处理结算订单数据
		handlePaymentData() {
			this.orderCreateData.delivery = {};
			this.orderCreateData.coupon = {};

			this.orderCreateData.is_balance = 0;
			this.orderCreateData.is_point = 0;

			this.orderCreateData.is_invoice = 0; // 是否需要发票 0 无发票  1 有发票
			this.orderCreateData.invoice_type = 1; // 发票类型  1 纸质 2 电子
			this.orderCreateData.invoice_title_type = 1; // 发票抬头类型 1 个人 2企业
			this.orderCreateData.is_tax_invoice = 0; // 是否需要增值税专用发票  0 不需要 1 需要
			this.orderCreateData.invoice_title = '';

			var data = this.orderPaymentData;

			// 店铺配送方式
			if (data.shop_goods_list.express_type != undefined && data.shop_goods_list.express_type[0] != undefined) {
				var express_type = data.shop_goods_list.express_type;
				this.orderCreateData.delivery.store_id = 0;
				// 获取选择配送方式缓存
				var delivery_storage = uni.getStorageSync('delivery');
				if (delivery_storage) {
					var delivery_type = delivery_storage.name;
					var delivery_type_name = delivery_storage.title;
					express_type.forEach(item => {
						if ((delivery_type == 'store' && item.name == delivery_type) || (delivery_type == 'local' && item.name == delivery_type)) {
							this.storeSelected(item);
						}
					})
					// 如果配送方式缓存是门店配送模拟点击门店tab选项
					if (delivery_type == 'store') {
						this.member_address = {
							mobile: data.member_account.mobile != '' ? data.member_account.mobile : ''
						};
					}
				} else {
					var delivery_type = express_type[0].name;
					if(delivery_type == "store"){
						this.member_address = {
							mobile: data.member_account.mobile != '' ? data.member_account.mobile : ''
						};
					}
					var delivery_type_name = express_type[0].title;
				}
				this.orderCreateData.delivery.delivery_type = delivery_type;
				this.orderCreateData.delivery.delivery_type_name = delivery_type_name;

				// 如果默认配送方式是门店配送模拟点击门店tab选项
				if (express_type[0].name == 'store' || express_type[0].name == 'local') {
					this.storeSelected(express_type[0]);
				}
			}

			if (data.is_virtual) this.member_address = {
				mobile: data.member_account.mobile != '' ? data.member_account.mobile : ''
			};

			Object.assign(this.orderPaymentData, this.orderCreateData);
		},
		// 显示弹出层
		openPopup(ref) {
			this.$refs[ref].open();
		},
		// 关闭弹出层
		closePopup(ref) {
			if (this.tempData) {
				Object.assign(this.orderCreateData, this.tempData);
				Object.assign(this.orderPaymentData, this.tempData);
				this.tempData = null;
				this.$forceUpdate();
			}
			this.$refs[ref].close();
		},
		// 选择收货地址
		selectAddress() {
			var params = {
				back: encodeURIComponent('/pages_promotion/blindbox/fill_address?blindbox_goods_id='+this.blindbox_goods_id+'&out_trade_no='+this.outTradeNo),
				local: 0,
				type: 1
			}
			// 外卖配送需要定位地址
			if (this.orderPaymentData.delivery.delivery_type == 'local') {
				params.local = 1;
				params.type = 2;
			}
			this.$util.redirectTo('/pages_tool/member/address', params);
		},
		// 订单计算
		orderCalculate() {
			var data = this.$util.deepClone(this.orderCreateData);
			data.delivery = JSON.stringify(data.delivery);

			this.$api.sendRequest({
				url: '/blindbox/api/order/calculate',
				data,
				success: res => {
					if (res.code >= 0) {
						if (res.data.delivery) {
							if (res.data.delivery.delivery_type == 'express') this.memberAddress = res.data.member_address;
							if (res.data.delivery.delivery_type == 'local') this.localMemberAddress = res.data.member_address;
						}
						if (res.data.shop_goods_list.local_config) this.orderPaymentData.local_config = res.data.shop_goods_list.local_config;
						if (res.data.shop_goods_list.delivery_store_info) this.orderPaymentData.delivery_store_info = res.data.shop_goods_list.delivery_store_info;
						this.$forceUpdate();
					} else {
						this.$util.showToast({
							title: res.message
						});
					}
				}
			})
		},
		/**
		 * 订单创建
		 * @param {String} pay_password 支付密码
		 */
		orderCreate() {
			if (this.verify()) {
				if (this.isSub) return;
				this.isSub = true;
				
				uni.showLoading({ title: '' })

				var data = this.$util.deepClone(this.orderCreateData);
				data.delivery = JSON.stringify(data.delivery);
				if (this.orderCreateData.delivery.delivery_type == 'store') {
					data.member_address = JSON.stringify(this.member_address);
				} else {
					data.member_address = JSON.stringify(data.member_address);
				}

				this.$api.sendRequest({
					url: '/blindbox/api/order/create',
					data,
					success: res => {
						uni.hideLoading();
						if (res.code == 0) {
							this.$util.redirectTo('/pages/order/list', {}, 'redirectTo');
						} else {
							if(res.data == ""){
								this.$util.showToast({
									title: res.message
							 	});
							}
							this.isSub = false;
						}
					},
					fail: res => {
						uni.hideLoading();
						this.isSub = false;
					}
				})
			}
		},
		// 订单验证
		verify() {
			if (this.orderPaymentData.is_virtual == 0) {
				if (!this.orderCreateData.delivery || !this.orderCreateData.delivery.delivery_type) {
					this.$util.showToast({
						title: '商家未设置配送方式'
					});
					return false;
				}
				
				if (this.orderCreateData.delivery.delivery_type != 'store') {
					if (!this.orderPaymentData.member_address) {
						this.$util.showToast({
							title: '请先选择您的收货地址'
						});
						return false;
					}
				}
				if (this.orderCreateData.delivery.delivery_type != 'store') {
					if (!this.orderPaymentData.member_address) {
						this.$util.showToast({
							title: '请先选择您的收货地址'
						});
						return false;
					}
				}

				if (this.orderCreateData.delivery.delivery_type == 'store') {
					if (!this.orderCreateData.delivery.store_id) {
						this.$util.showToast({
							title: '没有可提货的门店,请选择其他配送方式'
						});
						return false;
					}
					if (!this.member_address.mobile) {
						this.$util.showToast({
							title: '请输入预留手机'
						});
						return false;
					}
					var reg = /^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][1,8,9]))[0-9]{8}$/;
					if (!reg.test(this.member_address.mobile)) {
						this.$util.showToast({
							title: '请输入正确的预留手机'
						});
						return false;
					}

					if(!this.orderCreateData.buyer_ask_delivery_time){
						this.$util.showToast({
							title: '请输入自提时间'
						});
						return false;
					}
				}

				if (this.orderCreateData.delivery.delivery_type == 'local') {
					if (!this.orderCreateData.delivery.store_id) {
						this.$util.showToast({
							title: '没有可配送的门店,请选择其他配送方式'
						});
						return false;
					}
					if (this.orderPaymentData.local_config && this.orderPaymentData.local_config.info && this.orderPaymentData.local_config.info.time_is_open == 1 && !this.orderCreateData.buyer_ask_delivery_time) {
						this.$util.showToast({
							title: '请选择配送时间'
						});
						return false;
					}
				}

			}
			return true;
		},
		// 选择配送方式
		selectDeliveryType(data) {
			uni.setStorageSync('delivery', {
				title: data.title,
				name: data.name
			});
			this.orderCreateData.delivery.delivery_type = data.name;
			this.orderCreateData.delivery.delivery_type_name = data.title;
			// 如果是门店配送
			if (data.name == 'store') {
				this.storeSelected(data);
				if (!this.member_address.mobile) this.member_address.mobile = this.orderPaymentData.member_account.mobile != '' ? this.orderPaymentData.member_account.mobile : '';
			}
			if (data.name == 'local') {
				this.storeSelected(data);
			}
			Object.assign(this.orderPaymentData, this.orderCreateData);
			this.orderCalculate();
			this.$forceUpdate();
		},
		// 切换到门店
		storeSelected(data) {
			// 门店列表
			this.storeInfo.storeList = data.store_list;
			let store = data.store_list[0] ? data.store_list[0] : null;
			this.selectPickupPoint(store);
		},
		/**
		 * 选择自提点 
		 */
		selectPickupPoint(store_item) {
			if (store_item) {
				this.orderCreateData.delivery.store_id = store_item.store_id;
				this.storeInfo.currStore = store_item;
			} else {
				this.orderCreateData.delivery.store_id = 0;
				this.storeInfo.currStore = {};
			}
			this.orderCreateData.buyer_ask_delivery_time = '';
			this.orderCreateData.buyer_ask_delivery_title = '';
			Object.assign(this.orderPaymentData, this.orderCreateData);
			this.orderCalculate();
			this.$forceUpdate();
			this.$refs['deliveryPopup'].close();
		},
		popupConfirm(ref) {
			this.orderCalculate();
			this.$forceUpdate();
			this.tempData = null;
			this.$refs[ref].close();
		},
		imageError(goodsIndex) {
			this.orderPaymentData.shop_goods_list.goods_list[goodsIndex].sku_image = this.$util.getDefaultImage().goods;
			this.$forceUpdate();
		},
		navigateTo(sku_id) {
			this.$util.redirectTo('/pages/goods/detail', {
				sku_id
			});
		},
		/**
		 * 同城配送数据处理
		 */
		localtime(type = ''){
			let data = this.$util.deepClone(this.orderPaymentData.local_config.info);
			if (data.delivery_time) {
				data.end_time = data.delivery_time[ (data.delivery_time.length - 1) ].end_time;
			}
			let obj = {
				delivery: this.orderCreateData.delivery,
				dataTime: data
			}
			this.$refs.timePopup.open(obj,type);
		},
		/**
		 * 门店自提数据处理
		 */
		storetime(type = ''){
			if(this.orderPaymentData.delivery_store_info){
				let delivery_store_info = JSON.parse(this.orderPaymentData.delivery_store_info);
				let data = {
					time_type: delivery_store_info.time_type,
					end_time: delivery_store_info.end_time,
					start_time: delivery_store_info.start_time,
					time_week: delivery_store_info.time_week,
				};
				let obj = {
					delivery:this.orderCreateData.delivery,
					dataTime:data
				}
				this.$refs.timePopup.open(obj,type);
				this.$forceUpdate();
			}
		},
		/**
		 * 弹窗返回数据
		 */
		selectPickupTime(data){
			if(data.data && data.data.month){
				let nowDate = new Date();
				let Year =  nowDate.getFullYear();
				let timeData = data.data.month.split('月');
				let month = timeData[0];
				let date = timeData[1].split('日')[0]
				
				this.orderCreateData.buyer_ask_delivery_time = Year + '-' + month + '-' + date + ' ' + data.data.time + ':00'
				if(data.data.title == '今天' || data.data.title == '明天'){
					this.orderCreateData.buyer_ask_delivery_title =  data.data.title + '(' + data.data.time + ')'
				}else{
					this.orderCreateData.buyer_ask_delivery_title =  data.data.month + '(' + data.data.time + ')'
				}
				this.$forceUpdate();
			}
		},
		/**
		 * 保存留言
		 */
		saveBuyerMessage(){
			this.$refs.buyerMessagePopup.close();
		},
		/**
		 * 微信订阅消息
		 */
		subscribeMessage() {
			let keywords = 'ORDER_PAY,ORDER_DELIVERY,ORDER_TAKE_DELIVERY';
			if(this.orderCreateData.delivery && this.orderCreateData.delivery.delivery_type == 'store'){
				keywords = 'ORDER_PAY,ORDER_TAKE_DELIVERY';
			}
			this.$api.sendRequest({
				url: '/weapp/api/weapp/messagetmplids',
				data: {
					keywords: keywords
				},
				success: res => {
					if (res.data.length) {
						uni.requestSubscribeMessage({
							tmplIds: res.data,
							success: (res) => {},
							fail: (res) => {
								console.log('fail', res)
							}
						})
					}
				}
			})
		}
	},
	computed: {
		goodsData(){
			if (this.orderPaymentData.shop_goods_list.goods_list) {
				this.orderPaymentData.shop_goods_list.goods_list.forEach(item => {
					if (item.sku_spec_format) item.sku_spec_format = JSON.parse(item.sku_spec_format); 
				})
				return this.orderPaymentData.shop_goods_list;
			}
		},
		storeToken: function(nVal, oVal) {
			this.getOrderPaymentData();
		}
	},
	watch: {
		location: function(nVal){
			if (nVal) {
				this.getOrderPaymentData();
			}
		}
	},
	filters: {
		// 金额格式化输出
		moneyFormat(money) {
			return parseFloat(money).toFixed(2);
		}
	}
}
