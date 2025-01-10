<template>
	<div class="container mt-4">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div class="btn-group">

				<button class="btn btn-outline-secondary" :class="{ active: activeTab === 'list' }"
					@click="setActiveTab('list')" :disabled="activeTab === 'list'">
					투표 목록
				</button>
				<button class="btn btn-outline-secondary" :class="{ active: activeTab === 'resultList' }"
					@click="setActiveTab('resultList')" :disabled="activeTab === 'resultList'">
					투표 결과
				</button>
				<button class="btn btn-outline-secondary" :class="{ active: activeTab === 'mylist' }"
					@click="setActiveTab('mylist')" :disabled="activeTab === 'mylist'">
					내가 한 투표
				</button>
			</div>
		</div>

		<table class="table table-bordered text-center">
			<thead>
				<tr>
					<th>질문</th>
					<th>종료일</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(item, index) in activeList" :key="index">
					<td>
						<a href="#" class="text-decoration-none" @click.prevent="openDetailModal(item.id)">
							{{ item.title }}
						</a>
					</td>
					<td>{{ formatDate(item.endDateTime) }}</td>
				</tr>
			</tbody>
		</table>

		<div class="d-flex justify-content-center align-items-center mt-4">
			<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요" class="form-control w-25 me-2" />
			<button @click="search" class="btn btn-secondary me-2">검색</button>
			<button class="btn btn-secondary me-2" @click="openCreateModal">안건 등록</button>
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
	</div>

	<!-- 모달 -->
	<div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
		<div class="modal-content">
			<div class="modal-header">
				<!-- <h5 class="modal-title">Vote Detail</h5> -->
				<button type="button" class="btn-close" @click="closeDetailModal"></button>
			</div>
			<div class="modal-body">
				<p><strong>기간</strong> {{ formatDate(selectedVote.startDateTime) }} ~ {{ formatDate(selectedVote.endDateTime) }}
				</p>
				<p><strong>참여자</strong>{{ selectedVote.userNames }}, {{ selectedVote.departmentNames }}</p>
				<p><strong>질문</strong> {{ selectedVote.title }}</p>
				<p><strong>문항</strong></p>
				<!-- 투표 진행 중 -->
				<ul v-if="selectedVote.status === 'PENDING'">
					<li v-for="(answer, index) in parseAnswers(selectedVote.answers)" :key="index">
						<label>
							{{ answer }}
							<input type="radio" :value="answer" v-model="selectedAnswer" />
						</label>
					</li>
				</ul>

				<!-- 투표 종료 -->
				<ul v-else-if="selectedVote.status === 'END'">
					<li v-for="(item, index) in combineAnswersAndCounts(selectedVote.answers, selectedVote.answersCount)"
						:key="index">
						<strong>{{ item.answer }}: <input :disabled="selectedVote.status === 'END'" type="radio" :value="answer"
								v-model="selectedAnswer" />({{ item.count
							}}%)</strong>
					</li>
				</ul>
			</div>
			<div class="modal-footer">
				<button v-if="selectedVote.status === 'PENDING' && activeTab === 'list'" class="btn btn-secondary"
					@click="goToVote">투표 완료</button>
				<button v-if="selectedVote.status === 'PENDING' && activeTab === 'mylist'" class="btn btn-secondary"
					@click="goToVote">수정</button>
				<button v-if="selectedVote.status === 'END' || activeTab === 'mylist'" class="btn btn-secondary"
					@click="closeDetailModal">닫기</button>
			</div>
		</div>
	</div>


	<div v-if="isModalVisible" class="modal" tabindex="-1" style="display: block; background: rgba(0, 0, 0, 0.5);">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">안건 등록</h5>
				</div>
				<div class="modal-body">
					<form @submit.prevent="submitVote">
						<div class="mb-3">
							<label for="period" class="form-label">*기간</label>
							<div class="d-flex align-items-center">
								<input type="datetime-local" v-model="formattedStartDateTime" class="form-control me-2"
									:min="currentDateTime" step="1800" @change="handleStartTimeChange" required />
								<span>~</span>
								<input type="datetime-local" v-model="formattedEndDateTime" class="form-control ms-2"
									:min="currentDateTime" step="1800" @change="handleEndTimeChange" required />
							</div>
						</div>
						<div v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</div>
						<div class="mb-3">
							<label for="title" class="form-label">*질문</label>
							<input @input="questionValidate" title="질문은 최대 100자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
								type="text" v-model="newVote.title" class="form-control" required />
						</div>
						<div v-if="errors.question" class="text-danger mb-2">{{ errors.question }}</div>
						<div class="mb-3">
							<label class="form-label">*대답</label>
							<div v-for="(choice, index) in newVote.choices" :key="index" class="d-flex align-items-center mb-2">
								<input @input="answerValidate(index)"
									title="답변은 최대 100자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다." type="text"
									v-model="newVote.choices[index]" class="form-control me-2" :placeholder="`대답 ${index + 1}`"
									required />
								<button class="btn btn-secondary me-2" @click="addChoice">+</button>
								<button class="btn btn-secondary" v-if="newVote.choices.length >= 1"
									@click="removeChoice(index)">-</button>
							</div>
							<div v-if="errors.answer" class="text-danger mb-2">{{ errors.answer }}</div>
						</div>


						<div class="mb-3">
							<label for="users" class="form-label">참여자</label>
							<div class="input-group">
								<input type="text" v-model="searchUser" class="form-control" placeholder="참여자 검색" />
								<button class="btn btn-outline-secondary" type="button" @click="searchForEntities">검색</button>
							</div>
							<ul v-if="searchResults.length > 0" class="list-group mt-2" :style="computedHeight">
								<li v-for="entity in searchResults" :key="entity.id"
									class="list-group-item d-flex justify-content-between align-items-center">
									{{ entity.name }} <span v-if="entity.type === 'USER'">({{ entity.account }})</span>
									<button class="btn btn-sm btn-secondary" @click="addEntity(entity)">추가</button>
								</li>
							</ul>
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
						</div>
						<div v-if="errors.user" class="text-danger mb-2">{{ errors.user }}</div>
						<div class="text-end">
							<button type="submit" class="btn btn-secondary me-2">저장</button>
							<button type="button" class="btn btn-secondary" @click="hideModal">취소</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>

</template>

<script>
import api from "@/axios";

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
			errorMessage: "",
			isModalVisible: false,
			searchUser: '',
			votes: [],
			selectedVote: [],
			selectedAnswer: null,
			newVote: {
				id: this.userProfile.id,
				startDateTime: '',
				endDateTime: '',
				title: '',
				choices: [""],
				userId: [],
				departmentId: [],
			},
			showDetailModal: false,
			searchResults: [],
			activeTab: "list", // 현재 활성화된 탭 (list, resultList, mylist)
			list: [], // 투표 목록 데이터
			resultList: [], // 투표 결과 데이터
			mylist: [], // 내가 한 투표 데이터
			searchQuery: "", // 검색어
			totalPages: 1, // 전체 페이지 수
			currentPage: 1, // 현재 페이지
			pageSize: 10, // 페이지당 항목 수
			userEntity: [],
			departmentEntity: [],
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
		// 활성화된 탭에 따라 데이터를 동적으로 반환
		activeList() {
			if (this.activeTab === "list") return this.list;
			if (this.activeTab === "resultList") return this.resultList;
			if (this.activeTab === "mylist") return this.mylist;
			return [];
		},
		formattedStartDateTime: {
			get() {
				return this.newVote.startDateTime;
			},
			set(value) {
				this.newVote.startDateTime = value;
			},
		},
		formattedEndDateTime: {
			get() {
				return this.newVote.endDateTime;
			},
			set(value) {
				this.newVote.endDateTime = value;
			},
		},
	},
	created() {
		this.fetchData("list"); // 기본 탭인 투표 목록 데이터를 불러옴
	},
	methods: {
		questionValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newVote.title)) {
				this.errors.question = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else {
				this.errors.question = '';
			}

			// 최대 길이 제한
			if (this.newVote.title.length > 100) {
				this.newVote.title = this.newVote.title.slice(0, 100);
				this.errors.question = '최대 100자까지만 입력 가능합니다.';
			}
		},
		answerValidate(index) {
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			// 허용되지 않은 문자를 제거
			if (!regex.test(this.newVote.choices[index])) {
				this.errors.answer = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
				return;
			}

			// 최대 길이 제한
			if (this.newVote.choices[index].length > 100) {
				this.newVote.choices[index] = this.newVote.choices[index].slice(0, 100);
				this.errors.answer = '최대 100자까지만 입력 가능합니다.';
				return;
			}

			// 오류 메시지 초기화
			this.errors.answer = '';
		},
		addChoice() {
			this.newVote.choices.push('');
		},
		removeChoice(index) {
			this.newVote.choices.splice(index, 1);
		},
		percentCount(countList) {
			console.log("Input countList:", countList); // 입력 데이터 확인
			return countList.reduce((total, count) => {
				console.log("Current total:", total, "Current count:", count);
				return total + count;
			}, 0);
		},
		parseCount(counts) {

			if (!Array.isArray(counts)) {
				throw new Error("Counts must be an array");
			}

			// String 배열을 숫자 배열로 변환
			return counts.map(count => {
				const parsed = Number(count); // 각 요소를 숫자로 변환
				if (isNaN(parsed)) {
					throw new Error(`Invalid number in counts: "${count}"`);
				}
				return parsed;
			});
		},
		combineAnswersAndCounts(answers, counts) {
			const parsedAnswers = this.parseAnswers(answers);
			const parsedCounts = this.parseAnswers(counts);
			const parsedAnswersCount = this.parseCount(parsedCounts);
			console.log(parsedAnswersCount)
			let totalCount = this.percentCount(parsedAnswersCount);
			console.log(totalCount)
			if (totalCount === 0) {
				return parsedAnswers.map(answer => ({
					answer,
					count: 0, // Assign 0% when total count is 0
				}));
			}

			return parsedAnswers.map((answer, index) => ({
				answer,
				count: ((parsedAnswersCount[index] / totalCount) * 100).toFixed(2) || 0, // Percentage calculation
			}));
		},
		async goToVote() {
			if (!this.selectedAnswer) {
				alert("문항을 선택해주세요.");
				return;
			}
			console.log(this.selectedVote.id + "---------" + this.selectedAnswer)
			// API 요청으로 투표 데이터 전송
			try {
				console.log(this.selectedVote.id);
				console.log(this.selectedAnswer);
				await api.post(`/vote/vote`, {
					voteId: this.selectedVote.id,
					answer: this.selectedAnswer
				})
				alert("투표가 완료되었습니다.")
				this.closeDetailModal();
			}
			catch (error) {
				console.error("Error submitting vote:", error);
			};
		},
		parseAnswers(answers) {
			if (!answers) return []; // answers가 null/undefined일 경우 빈 배열 반환
			return answers.split(',').map((answer) => answer.trim()); // ',' 기준으로 분리 후 공백 제거
		},
		async openDetailModal(voteId) {

			try {
				const response = await api.get(`/vote/detail?voteId=${voteId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`, // Authorization 헤더 추가
					},
				})
				this.selectedVote = response.data;
				console.log(this.selectedVote);
				this.selectedAnswer = this.selectedVote.userSelect;
				console.log("----------" + this.selectedAnswer)
				this.showDetailModal = true;
			} catch (error) {
				console.error('Error fetching vote details:', error);
			};
		},
		closeDetailModal() {
			this.selectedVote = {}; // 데이터 초기화
			this.selectedAnswer = null;
			this.showDetailModal = false; // 모달 숨기기
		},
		addChoice() {
			this.newVote.choices.push(""); // 빈 문자열로 새로운 입력칸 추가
		},
		// 입력칸 삭제
		removeChoice(index) {
			this.newVote.choices.splice(index, 1); // 해당 인덱스에서 입력칸 제거
		},
		async searchForEntities() {
			try {
				const [userResponse, departmentResponse] = await Promise.all([
					api.get(`/user/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } }),
					api.get(`/department/search`, { params: { companyId: this.userProfile.companyId, search: this.userToAdd } })
				]);

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

				this.searchResults = [...userResults, ...departmentResults];
			} catch (error) {
				console.error("Failed to search entities", error);
			}
		},
		addEntity(entity) {
			if (entity.type === 'USER' && !this.newVote.userId.includes(entity.id)) {
				this.newVote.userId.push(entity.id);
				this.userEntity.push(entity);
			} else if (entity.type === 'DEPARTMENT' && !this.newVote.departmentId.includes(entity.id)) {
				this.newVote.departmentId.push(entity.id);
				this.departmentEntity.push(entity);
			}
			this.searchResults = null;
			this.searchUser = '';
			this.errors.user = '';
		},
		removeEntity(entity) {
			if (entity.type === 'USER') {
				this.newVote.userId = this.newVote.userId.filter(userId => userId !== entity.id);
				this.userEntity = this.userEntity.filter(user => user.id !== entity.id);
			} else if (entity.type === 'DEPARTMENT') {

				this.newVote.departmentId = this.newVote.departmentId.filter(deptId => deptId !== entity.id);
				this.departmentEntity = this.departmentEntity.filter(dept => dept.id !== entity.id);
			}
			console.log(this.newVote);
		},
		currentDateTime() {
			const now = new Date();

			// KST로 변환
			const offset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
			const kstNow = new Date(now.getTime() + offset);

			// 'YYYY-MM-DDTHH:mm' 형식으로 반환
			return kstNow.toISOString().slice(0, 16);
		},
		handleStartTimeChange() {


			const now = new Date(); // 현재 시간
			const startDateTime = new Date(this.newVote.startDateTime);
			const endDateTime = new Date(this.newVote.endDateTime);
			// Check if start time is after end time
			this.adjustToNearestHalfHour("start");
			if (startDateTime <= now) {
				this.errorMessage = "시작 시간은 현재 시간보다 이전일 수 없습니다.";
			} else {
				this.errorMessage = "";
			}

			// 시작 시간이 종료 시간보다 이후인지 확인
			if (startDateTime > endDateTime) {
				this.errorMessage = "시작 시간은 종료 시간보다 이전이어야 합니다.";
				this.newVote.endDateTime = ""; // 종료 시간 초기화
			} else {
				this.errorMessage = "";
			}
		},
		handleEndTimeChange() {


			const now = new Date(); // 현재 시간
			const nowPlus30Min = new Date(now); // 현재 시간을 복사
			nowPlus30Min.setMinutes(now.getMinutes() + 30); // 30분 추가
			const startDateTime = new Date(this.newVote.startDateTime);
			const endDateTime = new Date(this.newVote.endDateTime);

			this.adjustToNearestHalfHour("end");
			// Check if end time is before start time
			if (startDateTime >= endDateTime) {
				this.errorMessage = "종료 시간은 시작 시간보다 이후이어야 합니다.";
			} else {
				this.errorMessage = "";
			}
		},
		adjustToNearestHalfHour(field) {
			const dateTime = new Date(this.newVote[field + "DateTime"]);
			if (isNaN(dateTime)) return;

			// Adjust minutes to the nearest 30-minute mark
			const minutes = dateTime.getMinutes();
			const adjustedMinutes = minutes < 30 ? 30 : 60;

			if (adjustedMinutes === 60) {
				dateTime.setHours(dateTime.getHours() + 1);
				dateTime.setMinutes(0);
			} else {
				dateTime.setMinutes(adjustedMinutes);
			}

			const localISO = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16);

			// Update the respective field
			this.newVote[field + "DateTime"] = localISO;
		},
		async submitVote() {
			if (!this.formattedStartDateTime || !this.formattedEndDateTime) {
				this.errors.errorMessage = '기간을 설정해주세요.';
			} if (!this.newVote.title) {
				this.errors.title = '질문을 입력해주세요';
			} if (!this.newVote.choices || this.newVote.choices.length === 1) {
				this.errors.answer = '문항을 입력해주세요.'
			} if (this.userEntity.length === 0 && this.departmentEntity.length === 0) {
				this.errors.user = '투표에 참여할 사람을 추가해주세요.'
			} else {
				this.errors.user = '';
			}

			if (this.errors.errorMessage || this.errors.title || this.errors.answer || this.errors.user) {
				return;
			}
			try {
				await api.post("/vote/create", this.newVote);
				this.userEntity.length = 0;
				this.departmentEntity.length = 0;
				this.errors.user = '';
				this.fetchData("list");
				this.hideModal();
			} catch (error) {
				console.error("Failed to create vote", error);
			}
		},
		resetForm() {
			this.newVote = {
				startDateTime: '',
				endDateTime: '',
				title: '',
				choices: [],
				userId: [],
				departmentId: []
			};
			this.searchUser = '';
			this.searchResults = [];
		},
		showModal() {
			this.isModalVisible = true;
		},
		hideModal() {
			this.isModalVisible = false;
			this.resetForm();
		},
		// 활성화된 탭 변경
		setActiveTab(tab) {
			this.activeTab = tab;
			this.fetchData(tab); // 해당 탭에 맞는 데이터를 다시 불러옴
		},
		// 데이터 가져오기
		async fetchData(tab) {
			try {
				const response = await api.get(`/vote/${tab}`, {
					params: {
						page: this.currentPage,
						size: this.pageSize,
						search: this.searchQuery,
					},
				});
				if (tab === "list") this.list = response.data.content;
				if (tab === "resultList") this.resultList = response.data.content;
				if (tab === "mylist") this.mylist = response.data.content;
				this.totalPages = response.data.totalPages;
			} catch (error) {
				console.error(`Error fetching ${tab} data:`, error);
			}
		},
		// 검색
		search() {
			this.fetchData(this.activeTab);
		},
		// 페이지 이동
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			this.fetchData(this.activeTab);
		},
		// 날짜 포맷
		formatDate(dateString) {
			const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
			return new Date(dateString).toLocaleString("ko-KR", options);
		},
		// 모달 열기
		openCreateModal(id) {
			this.newVote = {
				id: this.userProfile.id,
				startDateTime: '',
				endDateTime: '',
				title: '',
				choices: [""],
				userId: [],
				departmentId: [],
			};
			this.errorMessage = '';
			this.userEntity = [];
			this.departmentEntity = [];
			this.errors = [];
			this.errors.user = '';
			this.isModalVisible = !this.isModalVisible;
			console.log("Open modal for ID:", id);
			// 모달 로직 추가
		},
	},
};
</script>

<style scoped>
.container {
	max-width: 900px;
}

.table th,
.table td {
	vertical-align: middle;
	font-size: 1rem;
}

.btn-group .btn {
	width: 150px;
}

.btn-group .btn.active {
	background-color: #6c757d;
	color: #fff;
}

.pagination .page-item {
	margin: 0 2px;
}

input.form-control {
	height: 40px;
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	max-width: 500px;
	width: 100%;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.modal-header .btn-close {
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
}

.modal-body p {
	margin: 0 0 10px;
}

.modal-footer {
	text-align: right;
}

input[type="radio"]:disabled {
	cursor: not-allowed;
	opacity: 0.6;
	/* 흐리게 표시 */
}

.active>.page-link,
.page-link.active {
	z-index: 3;
	color: #212529;
	background-color: #e9ecef;
	border-color: #f5f5f5;
}
</style>
