<template>
	<div class="d-flex flex-column min-vh-100">
		<header v-if="token" class="header-custom">
			<nav class="navbar navbar-expand-lg navbar-light bg-light">
				<div class="container-fluid">
					<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
						aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
						<span class="navbar-toggler-icon"></span>
					</button>

					<div class="collapse navbar-collapse" id="navbarNav">
						<!-- 좌측 메뉴 -->

						<ul class="navbar-nav me-auto">
							<li class="nav-item">
								<router-link to="/" @click="hideAllModal" class="nav-link">홈</router-link>
							</li>
							<li v-if="userProfile && (userProfile.role !== 'SUPER_ADMIN')" class="nav-item"
								style="position: relative;">
								<a href="#" class="nav-link" @click="toggleNotificationsModal">
									알림
									<span v-if="newNotificationCount > 0" class="badge bg-danger">
										{{ newNotificationCount }}
									</span>
								</a>
								<div v-if="showNotifications" class="notifications-modal">
									<div class="notifications-header">
										<h5>알림</h5>
										<button @click="toggleNotificationsModal">닫기</button>
									</div>
									<div class="notifications-content">
										<ul>
											<li v-for="notification in notifications" :key="notification.id" class="notification-item">
												<span>{{ notification.message }}</span>
												<small class="text-muted">{{ notification.createdAt }}</small>
											</li>
										</ul>
									</div>
								</div>
							</li>
							<!-- <li class="nav-item">
								<a href="#" class="nav-link" @click="toggleMessenger">메신저</a>
							</li> -->

							<li
								v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD' || userProfile.role === 'USER')"
								class="nav-item">
								<router-link to="/organization" @click="hideAllModal" class="nav-link">조직도</router-link>
							</li>
							<li
								v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD' || userProfile.role === 'USER')"
								class="nav-item">
								<router-link to="/schedule" @click="hideAllModal" class="nav-link">일정</router-link>
							</li>
							<li
								v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD' || userProfile.role === 'USER')"
								class="nav-item">
								<router-link to="/postmessage" @click="hideAllModal" class="nav-link">쪽지</router-link>
							</li>
							<li
								v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD' || userProfile.role === 'USER')"
								class="nav-item">
								<router-link to="/vote" @click="hideAllModal" class="nav-link">투표</router-link>
							</li>
							<li
								v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD' || userProfile.role === 'USER')"
								class="nav-item">
								<router-link to="/board" @click="hideAllModal" class="nav-link">공지</router-link>
							</li>
							<li v-if="userProfile && userProfile.role === 'ADMIN'" class="nav-item">
								<router-link to="/company" @click="hideAllModal" class="nav-link">회사</router-link>
							</li>
							<li v-if="userProfile && userProfile.role === 'SUPER_ADMIN'" class="nav-item">
								<router-link to="/management" @click="hideAllModal" class="nav-link">관리</router-link>
							</li>
							<li v-if="userProfile && (userProfile.role !== 'SUPER_ADMIN')" class="nav-item">
								<router-link to="/attendance" @click="hideAllModal" class="nav-link">근태</router-link>
							</li>
						</ul>

						<!-- 우측 사용자 영역 -->
						<div class="d-flex align-items-center justify-content-center position-relative user-area">
							<div class="user-photo-container">
								<img v-if="userProfile && userProfile.storedFileName" :src="`/upload/${userProfile.storedFileName}`"
									alt="User Profile" class="rounded-circle me-2 user-photo" />
								<!-- <span v-else class="no-photo">사진</span> -->
								<i v-else class="bi bi-person" style="font-size: 1.5rem;"></i>
							</div>
							<span v-if="userProfile && userProfile.role && userProfile.role !== 'USER'" class="me-1 role">{{
								formatRole(userProfile.role) }}</span>
							<span v-if="userProfile && userProfile.name" class="me-3 user-name" @click="toggleProfileMenu">{{
								userProfile.name }}</span>

							<div v-if="showProfileMenu" class="dropdown-menu position-absolute" style="top: 100%; left: auto;">
								<a class="dropdown-item" @click="showLoginHistory(); hideAllModal()">로그인 기록</a>
								<a class="dropdown-item" @click="goToPersonalInfoPage(); hideAllModal()">개인 정보</a>
							</div>
							<button class="btn btn-outline-secondary" @click="handleLogout">
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>
		</header>

		<main class="flex-grow-1">
			<div class="container-fluid mb-5">
				<div class="row">
					<!-- Chat List (PC 화면) -->
					<div v-if="token" class="col-md-2 d-none d-md-block chat-list-wrapper">
						<!-- <div class="mb-3 d-flex justify-content-between align-items-center">
							<input type="text" class="form-control form-control-sm flex-grow-1" placeholder="채팅방 이름"
								v-model="newChatRoomName" :style="{ width: '60%' }" />
							<button class="btn btn-outline-secondary btn-sm ms-2" @click="createChatRoom">생성</button>
						</div> -->

						<div class="list-group chat-list" style="overflow-y: auto; max-height: calc(100vh - 210px);">
							<ul class="list-unstyled m-0">
								<li class="list-group-item list-group-item-action" v-for="room in chatRooms" :key="room.id"
									@click="enterChatRoom(room.id)" style="cursor: pointer;">
									<div>{{ room.name }}</div>
									<div><small class="text-muted">{{ room.createdAt }}</small></div>
								</li>
							</ul>
						</div>
					</div>

					<!-- Chat List (모바일 화면) -->
					<div v-if="token" class="d-md-none col-12 d-md-block">
						<div class="mb-3 d-flex justify-content-between align-items-center">
							<!-- <button class="btn btn-outline-secondary btn-sm" @click="toggleMessenger">닫기</button> -->
							<input type="text" class="form-control form-control-sm ms-2 w-auto" placeholder="채팅방 이름"
								v-model="newChatRoomName" />
							<button class="btn btn-outline-secondary btn-sm ms-2" @click="createChatRoom">생성</button>
						</div>

						<div class="list-group chat-list">
							<ul class="list-unstyled m-0">
								<li class="list-group-item list-group-item-action" v-for="room in chatRooms" :key="room.id"
									@click="enterChatRoom(room.id)" style="cursor: pointer;">
									<!-- 첫 줄 -->
									<div class="fw-bold mb-1">{{ room.name }}</div><br>
									<!-- 둘째 줄 -->
									<div class="chat-room-date text-muted"><small>{{ room.createdAt }}</small></div>
								</li>
							</ul>
						</div>
					</div>

					<!-- Chat Room -->
					<div v-if="activeChatRoom && token" class="col-md-3 chat-room-wrapper">
						<div class="card chat-window">
							<div class="card-header chat-header d-flex flex-nowrap align-items-center">
								<!-- <div class="input-group input-group-sm" style="width: 70%;">
									<input type="text" class="form-control form-control-sm ms-2 w-auto" v-model="userToAdd"
										placeholder="사용자 이름" title="이름은 최대 30자로 영어 대소문자, 한글을 포함해야 합니다." @keyup.enter="onUserInput"
										ref="userInput" />
									<ul v-if="isSearchVisible" class="search-dropdown list-group position-absolute">
										<li class="list-group-item py-1" v-for="user in searchResults" :key="user.id"
											@click="selectUser(user)" style="cursor: pointer;">
											{{ user.name }}
											<span v-if="user.type === 'USER'">
												({{ user.account }})
											</span>
										</li>
									</ul>
								</div>
								<button class="btn btn-outline-secondary btn-sm ms-2 me-2" @click="inviteUserToRoom">추가</button> -->
								<button class="btn btn-outline-secondary btn-sm ms-auto"
									@click="closeChatWindow(activeChatRoom.id)">닫기</button>
							</div>

							<div class="card-body chat-messages" ref="chatMessages">
								<!-- 과거 메시지 -->
								<div class="previous-messages">
									<div v-for="message in previousMessages" :key="message.id" :class="[
										'chat-message',
										message.writer === userProfile.name ? 'chat-message-right' : 'chat-message-left'
									]">
										<strong>{{ message.writer }}:</strong> {{ message.message }}
									</div>
								</div>
								<!-- 현재 메시지 -->
								<div class="current-messages mt-2">
									<div v-for="message in activeChatRoom.messages" :key="message.id" :class="[
										'chat-message',
										message.writer === userProfile.name ? 'chat-message-right' : 'chat-message-left'
									]">
										<strong>{{ message.writer }}:</strong> {{ message.message }}
									</div>
								</div>
							</div>

							<div class="card-footer chat-input d-flex">
								<input type="text" class="form-control form-control-sm me-2" placeholder="메시지를 입력하세요"
									v-model="newMessage" @keyup.enter="sendMessage" />
								<button class="btn btn-outline-secondary btn-sm" @click="sendMessage">전송</button>
							</div>
						</div>
					</div>
					<div v-if="!activeChatRoom && token" class="col-md-3">
						<div class="d-grid align-items-center justify-content-center" style="height: calc(100vh - 210px);">
							<p class="text-muted">채팅창을 선택해주세요</p>
						</div>
					</div>
					<!-- Router View (8) -->
					<div :class="[token ? 'col-md-7' : 'col-md-12']">
						<router-view v-slot="{ Component, route }">
							<component :is="Component" v-bind="route.name === 'login'
								? {
									onLoginUser: uploadUser,
									onLoginSuccess: onLoginSuccess
								}
								: {
									userProfile: userProfile
								}" v-on="getEventListeners(route.name)" />
						</router-view>
					</div>
				</div>
			</div>
		</main>

		<footer v-if="token" class="bg-light p-3 mt-3">
			<div class="container">
				<p class="text-center">&copy; 2024 ERP. All Rights Reserved.</p>
			</div>
		</footer>
	</div>
</template>

<script>
import api from '@/axios';
import { Client } from "@stomp/stompjs";
export default {
	data() {
		return {
			errors: {},
			isSearchVisible: false,
			showNotifications: false,
			notifications: [],
			newNotificationCount: 0,
			notificationCheckInterval: null,
			token: localStorage.getItem('token'),
			userProfile: {
				id: null,
				account: '',
				departmentId: null,
				departmentName: '',
				email: '',
				name: '',
				originalFileName: '',
				password: '',
				positionId: null,
				positionName: '',
				role: '',
				status: '',
				storedFileName: '',
				phoneNumber: '',
				companyNumber: '',
				companyId: '',
			},
			showProfileMenu: false,
			chatRooms: [],
			stompClient: null,
			activeChatRoom: null,
			newMessage: '',
			previousMessages: [],
			newChatRoomName: '',
			dragging: false,
			offsetX: 0,
			offsetY: 0,
			userToAdd: '',
			searchResults: [],
			chatRoom: 0,
			loginUserProfile: {
				id: null,
				account: '',
				departmentId: null,
				departmentName: '',
				email: '',
				name: '',
				originalFileName: '',
				password: '',
				positionId: null,
				positionName: '',
				role: '',
				status: '',
				storedFileName: '',
				phoneNumber: '',
				companyNumber: '',
				companyId: '',
			},
			selectedChatRoom: [],
			userToAddObject: {},
			currentSubscription: [],
		};
	},
	created() {
		const publicPages = ['login', 'signUp'];
		const currentPage = this.$route.name;
		this.token = localStorage.getItem('token');
		if (!this.token && !publicPages.includes(currentPage)) {
			this.$router.push({ name: 'login' });
		} else if (this.token) {
			this.fetchChatRooms();
			this.myCompanyId();
			this.uploadUser();
			if (!this.userProfile) {
				this.fetchUserProfile();
			}
		}
		this.scrollToBottom();
	},
	methods: {
		formatRole(role) {
			if (role === 'ADMIN') {
				return '회사 관리자'
			} else if (role === 'SUPER_ADMIN') {
				return '서비스 관리자'
			} else if (role === 'HOD') {
				return '부서장'
			}
		},
		getEventListeners(routeName) {
			const eventMap = {
				'organization': {
					createMessengerGroupSuccess: this.fetchChatRooms,
					createMembersMessangerSuccess: this.fetchChatRooms,
				},
				// 다른 라우트와 이벤트 매핑 추가 가능
			};
			return eventMap[routeName] || {};
		},
		async myCompanyId() {
			const response = await api.get('/company/myCompany');
			this.companyId = response.data
			console.log(this.companyId)
		},
		initializeStompClient() {
			this.stompClient = new Client({
				brokerURL: 'ws://localhost:8080/ws',
				connectHeaders: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				debug: (str) => {
					console.log(`[STOMP DEBUG]: ${str}`);
				},
				onConnect: () => {
					console.log('STOMP 연결 성공');
					stompClient.subscribe(`/sub/updates/${this.userProfile.id}`, (message) => {
						console.log('Update message received:', message.body);
						this.fetchUserProfile();
						this.uploadUser();

					});
					// this.stompClient.subscribe('/sub/notifications', (message) => {
					// 	const notification = JSON.parse(message.body);
					// 	this.handleNotification(notification);
					// });
					// 초기 연결 시 필요한 구독 설정이 있다면 여기서 설정
				},
				onStompError: (frame) => {
					console.error("STOMP error:", frame.headers["message"], frame.body);
				},
				onWebSocketClose: (event) => {
					console.warn(`WebSocket closed: code ${event.code}, reason: ${event.reason}`);
				},
				onDisconnect: () => {
					console.log("STOMP 연결 해제됨");
				},
				reconnectDelay: 5000,
			});

			this.stompClient.activate();
		},

		enterChatRoom(roomId) {
			if (this.activeChatRoom?.id === roomId) return;

			// 이전 구독 취소 및 상태 초기화
			// if (this.stompClient && this.stompClient.connected) {
			// 	this.stompClient.unsubscribe(this.stompClient.id);

			// }
			if (this.stompClient && this.stompClient.connected) {
				if (this.currentSubscription && typeof this.currentSubscription.unsubscribe === 'function') {
					this.currentSubscription.unsubscribe();
					this.currentSubscription = null;
					this.activeChatRoom = null;
					this.previousMessages = [];
					this.newMessage = "";
				}

				this.userToAdd = "";
				this.selectedChatRoom = this.chatRooms.find((r) => r.id === roomId);
				this.chatRoom = roomId;

				if (this.selectedChatRoom) {
					this.activeChatRoom = { ...this.selectedChatRoom, messages: [] };
					console.log(`Entering chat room: ${roomId}`);
					this.loadChatMessages(roomId);

					// 이미 활성화된 stompClient 재사용
					if (this.stompClient && this.stompClient.connected) {
						// 메시지 구독
						this.currentSubscription = this.stompClient.subscribe(`/sub/room/${roomId}`, (message) => {
							try {
								const newMessage = JSON.parse(message.body);
								if (
									typeof newMessage.writer === 'string' &&
									typeof newMessage.message === 'string' &&
									typeof newMessage.type === 'string'
								) {
									this.activeChatRoom.messages.push(newMessage);
									this.$nextTick(() => {
										this.scrollToBottom();
									});
								} else {
									console.warn("수신된 메시지 형식이 올바르지 않습니다:", newMessage);
								}
							} catch (error) {
								console.error("Failed to process message:", error);
							}
						});
					} else {
						console.error("STOMP 클라이언트가 연결되지 않았습니다.");
					}

					this.$nextTick(() => {
						this.scrollToBottom();
					});
				}
			}
		},

		hideAllModal() {
			if (this.showNotifications) {
				this.showNotifications = false;
			}

			if (this.showProfileMenu) {
				this.showProfileMenu = false;
			}

		},
		selectUser(user) {
			this.userToAdd = user.name;
			this.userToAddObject = user;// 입력창에 선택한 이름 표시
			this.isSearchVisible = false; // 검색창 숨기기
		},
		async fetchUserProfile() {
			try {
				const response = await api.get('/user/profile');
				this.userProfile = response.data;
				console.log("?????")
				console.log(this.userProfile)
			} catch (error) {
				console.error('Failed to fetch user profile:', error);
			}
		},
		uploadUser(loginUserProfile) {

			this.userProfile = loginUserProfile;
			console.log("Received user profile:", this.userProfile);
		},

		async inviteUserToRoom() {
			try {

				const response = await api.post(
					'/room/invite',
					{
						roomId: this.selectedChatRoom.id,
						userId: this.userToAddObject.id,
						type: this.userToAddObject.type
					},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem('token')}`
						}
					},

				);
				console.log(this.selectedChatRoom.id + "------------" + this.userToAddObject.id);
				this.userToAddObject = {};
				console.log('User invited successfully:', response.data);
				alert('사용자가 초대되었습니다!');
			} catch (error) {
				console.error('Error inviting user to room:', error);

			}
		},
		onLoginSuccess(token) {
			console.log("token: " + token)
			this.token = token; // token과 경쟁
			this.fetchChatRooms();
			this.myCompanyId();
		},
		handleLogout() {
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('tokenExpiry');
			localStorage.removeItem('refreshTokenExpiry');
			this.token = null;
			this.$router.push({ name: 'login' });
			this.activeChatRoom = null;
		},
		toggleProfileMenu() {
			this.showProfileMenu = !this.showProfileMenu;
			console.log('Profile menu state:', this.showProfileMenu);
		},
		showLoginHistory() {
			this.$router.push({ name: 'loginhistory' });
			console.log('Show login history');
		},
		goToPersonalInfoPage() {
			this.$router.push({ name: 'myinfo' });
			console.log('Navigate to personal info page');
		},
		async fetchChatRooms() {
			try {
				const response = await api.get('/room/list');
				this.chatRooms = response.data;
			} catch (error) {
				console.error('Failed to fetch chat rooms:', error);
			}
		},
		async loadChatMessages(roomId) {
			try {
				const response = await api.get(`/room/loadChat`, { params: { roomId } });
				this.previousMessages = response.data.map(dto => ({
					id: dto.roomId,
					writer: dto.userName,
					message: dto.message,
					createdAt: dto.createdAt
				}));
			} catch (error) {
				console.error('Failed to load chat messages:', error);
			}
		},
		closeChatWindow(roomId) {

			if (this.stompClient && this.stompClient.active) {
				try {
					// 채팅방 퇴장 메시지 발행 전에 메시지가 유효한지 검증
					const leaveMessage = JSON.stringify({
						writer: this.userProfile.account,
						message: "",
						type: "LEAVE",
					});

					console.log("Closing chat room connection...");
					this.stompClient.publish({
						destination: `/app/room/${this.activeChatRoom}/left`, // Spring에서 매핑된 엔드포인트
						body: leaveMessage,
					});
					// 연결 비활성화 (비동기 처리)
					// this.stompClient.unsubscribe(this.stompClient.id);
					if (this.currentSubscription) {
						this.currentSubscription.unsubscribe();
						this.currentSubscription = null;
					}
				} catch (error) {
					console.error("Error closing chat room connection:", error);
				}
			} else {
				console.log("No active WebSocket connection to close.");
			}

			// 상태 초기화
			this.activeChatRoom = null;
			this.previousMessages = [];
			this.newMessage = "";
			this.userToAdd = "";
		},

		sendMessage() {
			if (this.activeChatRoom && this.newMessage.trim()) {
				// 메시지 유효성 검증 생략, 서버에서 처리
				// if (!this.isValidUTF8(this.newMessage)) {
				//     console.error("전송하려는 메시지에 유효하지 않은 UTF-8 문자가 포함되어 있습니다.");
				//     return;
				// }

				try {
					// 메시지 발행
					const messageBody = JSON.stringify({
						writer: this.userProfile.account,
						message: this.newMessage,
						type: "MESSAGE", // 서버에서 기대하는 타입 확인 필요
					});

					console.log("Sending message:", messageBody);

					this.stompClient.publish({
						destination: `/pub/room/${this.activeChatRoom.id}`,
						body: messageBody,
					});

					console.log(`Message sent to chat room ${this.activeChatRoom.id}`);
					this.newMessage = "";

					// 자동 스크롤
					this.$nextTick(() => {
						this.scrollToBottom();
					});
				} catch (error) {
					console.error("Error sending message:", error);
				}
			} else {
				console.warn("No active chat room or message is empty.");
			}
		},

		createChatRoom() {
			if (this.newChatRoomName.trim() !== '') {
				api.post('/room/create', null, { params: { roomName: this.newChatRoomName } })
					.then(() => {
						this.fetchChatRooms();
						this.newChatRoomName = '';
					})
					.catch(error => {
						console.error('Failed to create chat room:', error);
					});
			}
		},
		onUserInput() {
			if (this.userToAdd.trim() !== '') {
				this.isSearchVisible = true; // 검색 결과 표시
				this.addUserToChatRoom(); // 검색 결과 가져오기
			} else {
				this.isSearchVisible = false; // 입력값 없으면 숨기기
			}
		},
		async addUserToChatRoom() {
			if (!this.userToAdd) {
				alert("사용자 이름을 입력하세요.");
				return;
			}
			try {
				// Fetch data from both APIs simultaneously
				const [userResponse, departmentResponse] = await Promise.all([
					api.get(`/user/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } }),
					api.get(`/department/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } })
				]);

				// Process and combine results
				const userResults = userResponse.data.map(user => ({
					id: user.id,
					name: user.name,
					account: user.account,
					type: 'USER'
				}));

				const departmentResults = departmentResponse.data.map(department => ({
					id: department.id,
					name: department.name,
					type: 'DEPARTMENT'
				}));

				// Combine results into a single list
				this.searchResults = [...userResults, ...departmentResults];

			} catch (error) {
				console.error('Error searching for users:', error);
				alert("사용자 검색 중 오류가 발생했습니다.");
			}
		},
		scrollToBottom() {
			const chatMessages = this.$refs.chatMessages;
			if (chatMessages) {
				chatMessages.scrollTop = chatMessages.scrollHeight;
			}
		},

		async toggleNotificationsModal() {
			this.showNotifications = !this.showNotifications;

			await api.post('/noti/read');
		},
		async fetchNotifications() {
			try {
				const response = await api.get('/noti/list');
				// 응답 데이터가 배열인지 확인하고 정렬
				const newNotifications = Array.isArray(response.data)
					? response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
					: [];

				// 읽지 않은 알림 수 계산

				const unreadNotificationsCount = newNotifications.filter((n) => !n.readAt).length;

				this.newNotificationCount = unreadNotificationsCount;
				// this.fetchChatRooms();
				this.notifications = newNotifications;
				if (this.showNotifications === true) {
					this.newNotificationCount = 0;
				}
			} catch (error) {
				console.error('Failed to fetch notifications:', error);
			}
		},
		// async toggleMessenger() {

		// 	if (this.showNotifications) {
		// 		this.showNotifications = false;
		// 	}
		// 	try {
		// 		const response = await api.get('/room/list');
		// 		this.chatRooms = response.data;
		// 	} catch (error) {
		// 		console.error('Failed to fetch chat rooms:', error);
		// 	}
		// }
	},
	watch: {
		previousMessages() {
			this.scrollToBottom();
		},
		'activeChatRoom.messages'() {
			this.scrollToBottom();
		},
		token: {
			handler(newValue, oldValue) {
				if (newValue) {
					// 토큰이 새로 설정될 때 동작
					this.scrollToBottom();

					// 이전에 설정된 인터벌이 있으면 먼저 해제
					if (this.notificationCheckInterval) {
						clearInterval(this.notificationCheckInterval);
					}

					// 새로운 토큰에 대해 알림 체크 인터벌 설정
					this.notificationCheckInterval = setInterval(() => {
						this.fetchNotifications();
					}, 1000); // 1초마다 알림 확인
				} else {
					// 토큰이 없을 때 동작: 인터벌 해제
					if (this.notificationCheckInterval) {
						clearInterval(this.notificationCheckInterval);
						this.notificationCheckInterval = null;
					}
				}
			},
			immediate: true  // 워처 등록 즉시 실행
		}

	},
	mounted() {
		this.initializeStompClient();
	},
	beforeUnmount() {
		clearInterval(this.notificationCheckInterval);
	},
	beforeMount() {

	},
	unmounted() {

	}
};
</script>

<style scoped>
nav {
	margin-bottom: 0px;
}

img {
	width: 40px;
	height: 40px;
	object-fit: cover;
}

.dropdown-menu {
	display: block;
	position: absolute;
	top: 100%;
	left: 0;
	transform: translateY(10px);
}

.messenger-modal {
	position: absolute;
	top: 70px;
	left: 65px;
	width: 400px;
	height: 400px;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 5px;
	overflow-y: auto;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}



@media (max-width: 768px) {
	.messenger-modal {
		position: relative;
		top: 0px;
		left: 0px;
		width: 320px;
		height: 400px;
		background-color: white;
		border: 1px solid #ccc;
		border-radius: 5px;
		overflow-y: auto;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
}

.messenger-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	background-color: #f5f5f5;
	border-bottom: 1px solid #ddd;
}

.messenger-content ul {
	list-style: none;
	padding: 0;
	margin: 0;
}

.messenger-room {
	display: flex;
	justify-content: space-between;
	padding: 10px;
	border-bottom: 1px solid #eee;
	font-size: 14px;
}

.messenger-room:hover {
	background-color: #f9f9f9;
	cursor: pointer;
}

.chat-window {
	width: 100%;
	height: calc(100vh - 210px);
	/* 화면 전체 높이에서 footer(또는 다른 요소)의 높이를 제외 */
	background-color: #f8f9fa;
	border: 1px solid #dee2e6;
	border-radius: 5px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: column;
}

.chat-header {
	padding: 10px;
	border-bottom: 1px solid #ddd;
	background-color: #f5f5f5;
}

.chat-messages {
	flex: 1;
	padding: 10px;
	overflow-y: auto;
	/* 스크롤 활성화 */
	display: flex;
	flex-direction: column;
	/* 메시지를 위에서 아래로 정렬 */
}

.chat-message {
	margin-bottom: 10px;
	padding: 8px 12px;
	border-radius: 15px;
	background-color: #f1f1f1;
	max-width: 70%;
}

.chat-message-right {
	margin-left: auto;
	background-color: #dee2e6;
}

.chat-input {
	padding: 10px;
	border-top: 1px solid #ddd;
	background-color: #f5f5f5;
	display: flex;
	align-items: center;
}

.chat-input input {
	flex: 1;
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 3px;
	margin-right: 5px;
}

.chat-input button {
	padding: 5px 10px;
	border: none;
	background-color: #6c757d;
	color: #fff;
	border-radius: 3px;
	cursor: pointer;
}

@media (max-width: 768px) {
	.chat-window {
		height: auto;
		margin-bottom: 1rem;
	}
}

.notifications-modal {
	position: absolute;
	top: 100%;
	left: 0;
	width: 300px;
	background: #fff;
	border: 1px solid #ccc;
	border-radius: 5px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	z-index: 1000;
}

.notifications-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	border-bottom: 1px solid #ddd;
	background-color: #f5f5f5;
}

.notifications-content {
	padding: 10px;
	max-height: 300px;
	overflow-y: auto;
}

.notification-item {
	padding: 10px;
	border-bottom: 1px solid #eee;
	font-size: 14px;
}

.search-dropdown {
	position: absolute;
	/* 부모 컨테이너 기준으로 위치 설정 */
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 5px;
	width: 100%;
	/* 입력창 너비에 맞게 설정 */
	max-height: 150px;
	/* 최대 높이 설정 */
	overflow-y: auto;
	/* 스크롤 가능 */
	z-index: 1000;
	/* 입력창 위로 표시 */
	list-style: none;
	padding: 5px;
	margin: 0;
	top: 100%;
	/* 입력창 바로 아래에 배치 */
	left: 5px;
	/* 입력창의 왼쪽 정렬 */
	box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
	/* 살짝 그림자 추가 */
}

.search-dropdown li {
	padding: 5px;
	border-bottom: 1px solid #eee;
}

.search-dropdown li:hover {
	background-color: #f1f1f1;
	/* 호버 시 배경색 */
}

.component {
	display: inline-block;
	/* 자식 컴포넌트가 가로로 나란히 배치되도록 설정 */
}

/* 헤더 전체 스타일 */
.header-custom {
	background-color: #f8f9fa;
	/* bg-light 유사 색상 */
	padding: 0.5rem 1rem;
	/* p-3(=1rem)에서 더 줄여보기 */
	margin-bottom: 1rem;
	/* mb-3(=1rem)에서 줄이거나 삭제 가능 */
	border-bottom: 1px solid #ddd;
}

/* navbar */
.navbar {
	padding: 0;
	/* Bootstrap의 기본 NavBar 패딩을 줄임 */
}

/* 좌측 메뉴 아이템 조정 */
.navbar-nav .nav-link {
	padding: 0.5rem 0.75rem;
	/* 기본 padding을 살짝 축소 */
	font-size: 0.9rem;
	/* 폰트 크기 살짝 줄여서 컴팩트하게 */
}

/* 우측 사용자 영역 */
.user-area {
	gap: 0.5rem;
	/* Flex item 간격 추가(선택) */
}

/* 사용자 사진 영역 */
.user-photo-container {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 1px solid #ccc;
	overflow: hidden;
	text-align: center;
	/* 플렉스 컨테이너로 설정 */
	align-items: center;
	/* 수직 중앙 정렬 */
	justify-content: center;
	/* 수평 중앙 정렬 */
}

/* 실제 사진 크기 조정 */
.user-photo {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

/* 사진이 없을 때 표시되는 텍스트 */
.no-photo {
	display: inline-block;
	line-height: 2;
	font-size: 0.8rem;
}

/* 사용자 이름 */
.user-name {
	font-size: 0.9rem;
	cursor: pointer;
}

.role {
	font-size: 0.7rem;

}

.scrollable-container {
	overflow-y: auto;
	overflow-x: auto;
	/* X축 스크롤도 필요하면 추가 */
	max-height: calc(100vh - 210px);
	;
	/* 화면 높이를 넘지 않도록 제한 */
}
</style>
