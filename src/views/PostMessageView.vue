<template>
	<div class="container mt-4">
		<div class="d-flex justify-content-between mb-3">

			<div class="btn-group">
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentTable !== 'received', 'btn-secondary': currentTable === 'received' }"
					@click="currentTable = 'received'; fetchReceivedMessages()" :disabled="currentTable === 'received'">받은
					메시지</button>
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentTable !== 'sent', 'btn-secondary': currentTable === 'sent' }"
					@click="currentTable = 'sent'; fetchSentMessages()" :disabled="currentTable === 'sent'">보낸
					메시지</button>
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentTable !== 'trash', 'btn-secondary': currentTable === 'trash' }"
					@click="currentTable = 'trash'; fetchTrashMessages()" :disabled="currentTable === 'trash'">휴지통</button>
			</div>
		</div>

		<div v-if="currentTable === 'received'">
			<table class="table table-bordered text-center">
				<thead>
					<tr>
						<th>선택</th>
						<th>제목</th>
						<th>발신자</th>
						<th>받은날짜</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="message in receivedMessages" :key="message.id">
						<td><input type="checkbox" v-model="selectedMessages" :value="message.id" /></td>
						<td @click="showDetails(message)">{{ message.title }}</td>
						<td>{{ message.sender }}</td>
						<td>{{ formatDate(message.createdAt) }}</td>
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요"
					class="form-control d-inline-block w-50 me-2" />
				<button @click="search" class="btn btn-secondary me-2">검색</button>
				<button class="btn btn-secondary me-2" @click="deleteSelected">삭제</button>
				<button class="btn btn-secondary me-2" data-bs-toggle="modal" data-bs-target="#sendMessageModal">쪽지 보내기</button>
			</div>
		</div>

		<div v-if="currentTable === 'sent'">

			<table class="table table-bordered text-center">
				<thead>
					<tr>
						<th>선택</th>
						<th>제목</th>
						<th>수신자</th>
						<th>보낸날짜</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="message in sentMessages" :key="message.id">
						<td><input type="checkbox" v-model="selectedMessages" :value="message.id" /></td>
						<td @click="showDetails(message)">{{ message.title }}</td>
						<td>{{ message.receivers }}</td>
						<td>{{ formatDate(message.createdAt) }}</td>
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요"
					class="form-control d-inline-block w-50 me-2" />
				<button @click="search" class="btn btn-secondary me-2">검색</button>
				<button class="btn btn-secondary me-2" @click="deleteSelected">삭제</button>
				<button class="btn btn-secondary me-2" data-bs-toggle="modal" data-bs-target="#sendMessageModal">쪽지 보내기</button>
			</div>
		</div>

		<div v-if="currentTable === 'trash'">
			<p>휴지통에는 30일 후 삭제됩니다.</p>
			<table class="table table-bordered text-center">
				<thead>
					<tr>
						<th>선택</th>
						<th>제목</th>
						<th>발신자 / 수신자</th>
						<th>삭제날짜</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="message in trashMessages" :key="message.id">
						<td><input type="checkbox" v-model="selectedMessages" :value="message.id" /></td>
						<td @click="showDetails(message)">{{ message.title }}</td>
						<td v-if="message.messageType === 'RECEIVE'">{{ message.sender }}</td>
						<td v-else>{{ message.receivers }}</td>
						<td>{{ formatDate(message.deletedAt) }}</td>
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요"
					class="form-control d-inline-block w-50 me-2" />
				<button @click="search" class="btn btn-secondary me-2">검색</button>
				<button class="btn btn-secondary me-2" @click="realDeleteSelected">삭제</button>
				<button @click="resetModal" class="btn btn-secondary me-2" data-bs-toggle="modal"
					data-bs-target="#sendMessageModal">쪽지 보내기</button>
			</div>
		</div>

		<div class="d-flex justify-content-center align-items-center mt-3">

			<nav v-if="totalPages > 0" aria-label="Page navigation" class="d-flex justify-content-center mt-4">
				<ul class="pagination">
					<!-- 첫 페이지 -->
					<li class="page-item" :class="{ disabled: currentPage === 1 }">
						<a class="page-link" href="#" aria-label="First" @click.prevent="goToPage(1)">
							<span aria-hidden="true">&laquo;&laquo;</span>
						</a>
					</li>

					<!-- 이전 페이지 -->
					<li class="page-item" :class="{ disabled: currentPage === 1 }">
						<a class="page-link" href="#" aria-label="Previous" @click.prevent="goToPage(currentPage - 1)">
							<span aria-hidden="true">&laquo;</span>
						</a>
					</li>

					<!-- 페이지 번호 목록 (동적 계산) -->
					<li class="page-item" v-for="page in pageNumbers" :key="page" :class="{ active: page === currentPage }">
						<a class="page-link" href="#" @click.prevent="goToPage(page)">
							{{ page }}
						</a>
					</li>

					<!-- 다음 페이지 -->
					<li class="page-item" :class="{ disabled: currentPage === totalPages }">
						<a class="page-link" href="#" aria-label="Next" @click.prevent="goToPage(currentPage + 1)">
							<span aria-hidden="true">&raquo;</span>
						</a>
					</li>

					<!-- 마지막 페이지 -->
					<li class="page-item" :class="{ disabled: currentPage === totalPages }">
						<a class="page-link" href="#" aria-label="Last" @click.prevent="goToPage(totalPages)">
							<span aria-hidden="true">&raquo;&raquo;</span>
						</a>
					</li>
				</ul>
			</nav>
		</div>

		<!-- Modal -->
		<div class="modal fade" id="detailModal" tabindex="-1" aria-labelledby="detailModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-lg">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="detailModalLabel">{{ selectedMessage.title }}</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<p><strong>내용:</strong> {{ selectedMessage.content }}</p>
						<p><strong>발신자:</strong> {{ selectedMessage.sender }}</p>
						<p><strong>수신자:</strong> {{ selectedMessage.receivers }}</p>
						<p><strong>날짜:</strong> {{ formatDate(selectedMessage.createdAt) }}</p>
						<ul class="flex-grow-1 mb-0">
							<li v-for="fileName in parseFileNames(selectedMessage.files)" :key="fileName">
								<a :href="generateFileUrl(fileName)" download>{{ fileName }}</a>
							</li>
						</ul>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
					</div>
				</div>
			</div>
		</div>
		<!-- Send Message Modal -->
		<div class="modal fade" id="sendMessageModal" ref="sendMessageModal" tabindex="-1"
			aria-labelledby="sendMessageModalLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="sendMessageModalLabel">쪽지 보내기</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">

						<form>
							<div class="mb-3">
								<label for="title" class="form-label">제목</label>
								<input @input="titleValidate" type="text" class="form-control"
									title="제목은 최대 50자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다." id="title"
									v-model="newMessage.title" required />
							</div>
							<div v-if="errors.title" class="text-danger mt-2">{{ errors.title }}</div>
							<div class="mb-3">
								<label for="users" class="form-label">수신자</label>
								<div class="input-group">
									<input type="text" v-model="searchUser" class="form-control" placeholder="수신자 검색" />
									<button class="btn btn-outline-secondary" type="button" @click="searchForEntities">검색</button>
								</div>
								<ul v-if="searchResults.length > 0" class="list-group mt-2" :style="computedHeight">
									<li v-for="entity in searchResults" :key="entity.id"
										class="list-group-item d-flex justify-content-between align-items-center">
										{{ entity.name }} <span v-if="entity.type === 'USER'">({{ entity.account }})</span>
										<button class="btn btn-sm btn-secondary" @click="addEntity(entity)">추가</button>
									</li>
								</ul>
								<!-- <p v-else class="text-muted mt-2">검색 결과가 없습니다.</p> -->
								<div class="mt-3">
									<label class="form-label">추가된 부서 및 사용자</label>
									<ul class="list-group">
										<li v-for="(dept, index) in departmentEntity" :key="index" class="list-group-item">
											{{ dept.name }}
											<button class="btn btn-sm btn-secondary float-end" @click="removeEntity(dept)">제거</button>
										</li>
										<li v-for="(user, index) in userEntity" :key="index" class="list-group-item">
											{{ user.name }} ({{ user.account }})
											<button class="btn btn-sm btn-secondary float-end" @click="removeEntity(user)">제거</button>
										</li>
									</ul>
								</div>
								<div v-if="errors.user" class="text-danger mt-2">{{ errors.user }}</div>
							</div>
							<div class="mb-3">
								<label for="content" class="form-label">내용</label>
								<textarea @input="contentValidate" title="내용은 최대 1000자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
									class="form-control" id="content" rows="4" v-model="newMessage.content" required></textarea>
							</div>
							<div v-if="errors.content" class="text-danger mt-2">{{ errors.content }}</div>
							<div class="mb-3">
								<label for="files" class="form-label">파일 첨부</label>
								<input type="file" class="form-control" id="files" multiple @change="handleFileUpload" />
							</div>
							<div class="d-flex justify-content-end">
								<button type="button" @click="sendMessage" class="btn btn-secondary">보내기</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import api from '@/axios';
import { Modal } from 'bootstrap';
export default {
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			errors: {},
			userEntity: [],
			departmentEntity: [],
			errorMessage: "",
			participant: {},
			selectedMessage: {},
			messages: [],
			selectedMessages: [],
			searchQuery: "",
			totalPages: 1,
			currentPage: 1,
			pageSize: 10,
			currentTable: "received", // 초기값: 보낸 메시지
			newMessage: {
				title: "",
				content: "",
				files: [],
				departmentId: [],
				userId: [],
			},
			searchUser: "",
			searchResults: [],
		};
	},
	computed: {
		computedHeight() {
			const itemHeight = 50; // 각 항목의 높이 (대략적인 값, px 단위)
			const maxItems = 3; // 최대 표시 항목 개수
			const height = this.searchResults.length > maxItems
				? `${itemHeight * maxItems}px`
				: `${itemHeight * this.searchResults.length}px`;
			return {
				display: 'flex',
				overflowY: 'auto',
				height: height,
			};
		},
		pageNumbers() {
			// 전체 페이지 수가 10 이하라면 전체를 그냥 보여줌
			if (this.totalPages <= 10) {
				return Array.from({ length: this.totalPages }, (_, i) => i + 1);
			}

			// 10 페이지 초과할 때, 현재 페이지를 기준으로 슬라이딩 처리
			const maxVisible = 10;
			let startPage = this.currentPage - 4; // 현재 페이지 -4
			let endPage = this.currentPage + 5;   // 현재 페이지 +5

			// 만약 startPage가 1보다 작아지면 1로 고정
			if (startPage < 1) {
				startPage = 1;
				endPage = 10; // 1~10
			}
			// endPage가 totalPages보다 크면 totalPages로 고정
			if (endPage > this.totalPages) {
				endPage = this.totalPages;
				startPage = this.totalPages - maxVisible + 1; // totalPages - 9
				if (startPage < 1) startPage = 1;
			}

			// startPage부터 endPage까지 배열 생성
			const pages = [];
			for (let p = startPage; p <= endPage; p++) {
				pages.push(p);
			}
			return pages;
		},
		isFormValid() {
			return (
				this.newMessage.title.trim() !== "" &&
				this.newMessage.content.trim() !== "" &&
				(this.newMessage.userId.length > 0 || this.newMessage.departmentId.length > 0)
			);
		},
		receivedMessages() {
			return this.messages.filter((message) => message.type === "received");
		},
		sentMessages() {
			return this.messages.filter((message) => message.type === "sent");
		},
		trashMessages() {
			return this.messages.filter((message) => message.type === "trash");
		},
	},
	methods: {
		titleValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newMessage.title)) {
				this.errors.title = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else if (this.newMessage.title.length > 50) {
				this.newMessage.title = this.newMessage.title.slice(0, 50);
				this.errors.title = '최대 50자까지만 입력 가능합니다.';
			} else {
				this.errors.title = '';
			}
		},
		contentValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newMessage.content)) {
				this.errors.content = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else if (this.newMessage.content.length > 1000) {
				this.newMessage.content = this.newMessage.content.slice(0, 1000);
				this.errors.content = '최대 1000자까지만 입력 가능합니다.';
			} else {
				this.errors.content = '';
			}
		},
		userValidate() {

		},
		closeModal() {
			if (this.modal) this.modal.hide();
		},
		parseFileNames(fileNames) {
			if (!fileNames) return [];
			return fileNames.split(',');
		},
		generateFileUrl(fileName) {
			const serverIp = '/upload';
			return `${serverIp}/${fileName}`;
		},
		async showDetails(message) {

			this.selectedMessage = message;
			const modal = new Modal(document.getElementById("detailModal"));
			modal.show();
		},
		formatDate(dateString) {
			const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
			return new Date(dateString).toLocaleString("ko-KR", options);
		},
		async fetchSentMessages() {
			this.selectedMessages = [];
			try {
				const response = await api.get(`/postMessage/sendList?page=${this.currentPage}&size=${this.pageSize}`, {
					params: {
						search: this.searchQuery,
					},
				});
				this.totalPages = response.data.totalPages;
				this.messages = response.data.content.map((msg) => ({
					id: msg.id,
					receivers: msg.receivers,
					title: msg.title,
					content: msg.content,
					createdAt: msg.createdAt,
					files: msg.files,
					type: "sent",
				}));
				console.log(this.messages)
			} catch (error) {
				console.error("Error fetching sent messages:", error);
			}
		},
		async fetchReceivedMessages() {
			this.selectedMessages = [];
			try {
				const response = await api.get(`/postMessage/receiveList?page=${this.currentPage}&size=${this.pageSize}`, {
					params: {
						search: this.searchQuery,
					},
				});
				this.messages = response.data.content.map((msg) => ({
					id: msg.id,
					title: msg.title,
					content: msg.content,
					createdAt: msg.createdAt,
					userId: msg.userId,
					files: msg.files,
					sender: msg.sender, // 임시로 sender 정보 표시
					type: "received",
				}));
				this.totalPages = response.data.totalPages;
				console.log(this.messages)
			} catch (error) {
				console.error("Error fetching received messages:", error);
			}
		},
		async fetchTrashMessages() {
			this.selectedMessages = [];
			try {

				const response = await api.get(`/postMessage/deleteList?page=${this.currentPage}&size=${this.pageSize}`, {
					params: {
						search: this.searchQuery,
					},
				});
				this.messages = response.data.content.map((msg) => ({
					id: msg.id,
					title: msg.title,
					content: msg.content,
					createdAt: msg.createdAt,
					deletedAt: msg.deletedAt,
					receivers: msg.receivers,
					userId: msg.userId,
					sender: msg.sender,
					files: msg.files, // 임시로 sender 정보 표시
					type: "trash",
					messageType: msg.messageType
				}));
				this.totalPages = response.data.totalPages;
				console.log(this.messages)
			} catch (error) {
				console.error("Error fetching received messages:", error);
			}
		},
		async searchForEntities() {
			try {
				const [userResponse, departmentResponse] = await Promise.all([
					api.get(`/user/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } }),
					api.get(`/department/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } })
				]);
				const userResults = userResponse.data.map((user) => ({
					id: user.id,
					name: user.name,
					account: user.account,
					type: "USER",
				}));
				const departmentResults = departmentResponse.data.map((department) => ({
					id: department.id,
					name: department.name,
					type: "DEPARTMENT",
				}));
				this.searchResults = [...userResults, ...departmentResults];
			} catch (error) {
				console.error("Failed to search entities", error);
			}
		},
		addEntity(entity) {
			if (entity.type === "USER" && !this.newMessage.userId.includes(entity.id)) {
				this.newMessage.userId.push(entity.id);
				this.userEntity.push(entity);
			} else if (entity.type === "DEPARTMENT" && !this.newMessage.departmentId.includes(entity.id)) {
				this.newMessage.departmentId.push(entity.id);
				this.departmentEntity.push(entity);
			}
			this.errors.user = '';
		},
		// removeEntity(entity) {
		// 	if (entity.type === "USER") {
		// 		this.newMessage.userId = this.newMessage.userId.filter((userId) => userId !== entity.id);
		// 		this.userEntity = this.userEntity.filter(user => user.id !== entity.id);
		// 	} else if (entity.type === "DEPARTMENT") {
		// 		this.newMessage.departmentId = this.newMessage.departmentId.filter((deptId) => deptId !== entity.id);
		// 		this.departmentEntity = this.departmentEntity.filter(dept => dept.id !== entity.id);
		// 	}
		// },
		handleFileUpload(event) {
			this.newMessage.files = Array.from(event.target.files);
		},
		sendMessage() {
			if (!this.isFormValid) {
				if (!this.newMessage.title) {
					this.errors.title = '제목을 입력해주세요.';
				}
				if (this.userEntity.length === 0 && this.departmentEntity.length === 0) {
					this.errors.user = '쪽지를 보낼 수신자를 추가해주세요.';
				}
				if (!this.newMessage.content) {
					this.errors.content = '내용을 입력해주세요.';
				}
				return;
			}

			this.errorMessage = "";
			try {
				const formData = new FormData();
				formData.append("userId", this.userProfile.id);
				formData.append("title", this.newMessage.title);
				formData.append("content", this.newMessage.content);
				formData.append("receiverUserIds", this.newMessage.userId.join(",")); // List를 콤마로 구분된 String으로 변환
				formData.append("receiverDepartmentIds", this.newMessage.departmentId.join(",")); // 동일 처리
				this.newMessage.files.forEach((file) => {
					formData.append("files", file);
				});

				api.post("/postMessage/send", formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});

				alert("쪽지가 성공적으로 전송되었습니다.");

				// 메시지 전송 성공 시 모달 초기화
				this.newMessage = {
					title: "",
					content: "",
					files: [],
					departmentId: [],
					userId: [],
				};
				this.searchUser = "";
				this.searchResults = [];
				this.userEntity.length = 0;
				this.departmentEntity.length = 0;
				this.errors = [];
				const fileInput = document.getElementById("files");
				if (fileInput) {
					fileInput.value = ""; // 파일 입력 필드 초기화
				}

				const modalElement = document.getElementById("sendMessageModal");
				const modalInstance = Modal.getInstance(modalElement); // 이미 열린 모달 인스턴스 가져오기
				if (modalInstance) {
					modalInstance.hide(); // 모달 닫기
				}
			} catch (error) {
				console.error("Error sending message:", error);
				this.errors.user = '';
				alert("쪽지 전송에 실패했습니다.");
			}
		},
		resetModal() {
			this.newMessage = {
				title: "",
				content: "",
				files: [],
				departmentId: [],
				userId: [],
			};
			this.searchUser = "";
			this.searchResults = [];
			this.userEntity.length = 0;
			this.departmentEntity.length = 0;
			this.errors.user = '';
			const fileInput = document.getElementById("files");
			if (fileInput) {
				fileInput.value = ""; // 파일 입력 필드 초기화
			}
		},
		search() {
			if (this.currentTable === "sent") {
				this.fetchSentMessages();
			} else if (this.currentTable === "received") {
				this.fetchReceivedMessages();
			}
			console.log("검색어:", this.searchQuery);
		},
		async deleteSelected() {
			if (this.selectedMessages.length === 0) {
				alert("삭제할 메시지를 선택하세요.");
				return;
			}
			await api.post('/postMessage/delete', {
				ids: this.selectedMessages
			})
			console.log("삭제할 메시지 ID:", this.selectedMessages);
			// 삭제 로직 구현
		},

		async realDeleteSelected() {
			if (this.selectedMessages.length === 0) {
				alert("삭제할 메시지를 선택하세요.");
				return;
			}
			await api.post('/postMessage/realDelete', {
				ids: this.selectedMessages
			})
			console.log("삭제할 메시지 ID:", this.selectedMessages);
			// 삭제 로직 구현
		},
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			if (this.currentTable === "sent") {
				this.fetchSentMessages();
			} else if (this.currentTable === "received") {
				this.fetchReceivedMessages();
			} else if (this.currentTable === "trash") {
				this.fetchTrashMessages();
			}
			console.log("이동할 페이지:", page);
		},
		initializeRecipients() {
			const participants = this.$route.query.participant;

			console.log(participants); // 디버깅 로그: 쿼리 파라미터 출력

			if (participants) {
				try {
					const parsedParticipants = JSON.parse(participants);

					// Check if parsedParticipants is an array
					if (Array.isArray(parsedParticipants)) {
						// Process each participant
						parsedParticipants.forEach((entity) => {
							if (entity.type === 'USER') {
								// Pass the ID directly to the addEntityToMessage function
								this.addEntityToMessage(entity);
							} else if (entity.type === 'DEPARTMENT') {
								this.addEntityToMessage(entity);
							} else {
								console.warn('Unknown entity type:', entity);
							}
						});
					} else {
						console.warn('Parsed participants is not an array:', parsedParticipants);
					}
				} catch (error) {
					console.error('Failed to parse participants:', error);
				}
			}
		},
		addEntityToMessage(entity) {
			if (entity.type === 'USER' && !this.newMessage.userId.includes(entity.id)) {
				this.newMessage.userId.push(entity.id);
				this.userEntity.push(entity);
			} else if (entity.type === 'DEPARTMENT' && !this.newMessage.departmentId.includes(entity.id)) {
				this.newMessage.departmentId.push(entity.id);
				this.departmentEntity.push(entity);
			}
		},
		removeEntity(entity) {
			if (entity.type === 'USER') {
				this.newMessage.userId = this.newMessage.userId.filter(userId => userId !== entity.id);
				this.userEntity = this.userEntity.filter(user => user.id !== entity.id);
			} else if (entity.type === 'DEPARTMENT') {
				this.newMessage.departmentId = this.newMessage.departmentId.filter(deptId => deptId !== entity.id);
				this.departmentEntity = this.departmentEntity.filter(dept => dept.id !== entity.id);
			}
		}
	},
	created() {
		if (this.currentTable === "sent") {
			this.fetchSentMessages();
		} else if (this.currentTable === "received") {
			this.fetchReceivedMessages();
		}
	},
	mounted() {
		const modalElement = this.$refs.sendMessageModal;

		// Bootstrap modal 이벤트 등록
		modalElement.addEventListener('hidden.bs.modal', () => {
			// 모달이 완전히 닫힌 뒤에 실행되는 콜백
			this.resetModal();
		});
		this.initializeRecipients();
	}
};
</script>

<style scoped>
.container {
	max-width: 800px;
	margin: 0 auto;
}

.table {
	margin-bottom: 20px;
}

.pagination .page-item {
	margin: 0 2px;
}

.modal-backdrop {
	background-color: rgba(0, 0, 0, 0.5);
}

.btn-group .btn {
	width: 150px;
}

.btn-group .btn.active {
	background-color: #007bff;
	color: #fff;
}

.active>.page-link,
.page-link.active {
	z-index: 3;
	color: #212529;
	background-color: #e9ecef;
	border-color: #f5f5f5;
}
</style>