<template>
	<div class="container mt-4">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div class="btn-group">
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentView !== 'monthly', 'btn-secondary': currentView === 'monthly' }"
					@click="viewMonthly" :disabled="currentView === 'monthly'">월간 일정</button>
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentView !== 'weekly', 'btn-secondary': currentView === 'weekly' }"
					@click="viewWeekly" :disabled="currentView === 'weekly'">주간 일정</button>
				<button class="btn"
					:class="{ 'btn-outline-secondary': currentView !== 'list', 'btn-secondary': currentView === 'list' }"
					@click="viewList" :disabled="currentView === 'list'">일정 목록</button>
			</div>
		</div>
		<!-- Schedule Table -->
		<div v-if="currentView === 'list'">
			<table class="table table-bordered text-center align-middle">
				<thead>
					<tr>
						<th>제목</th>
						<th>등록자</th>
						<th>장소</th>
						<th>기간</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(item, index) in displayedSchedules" :key="index"
						:class="{ 'table-warning': isToday(item.startDateTime) }">
						<td @click="openDetailModal(item)">{{ item.title }}</td>
						<td>{{ item.name }}</td>
						<td>{{ item.place }}</td>
						<td>{{ formatPeriod(item.startDateTime, item.endDateTime) }}</td>
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<button class="btn btn-secondary me-2" @click="showModal">일정 추가</button>
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

		<!-- Weekly View Table -->
		<div v-if="currentView === 'weekly'">
			<!-- Week Navigation -->
			<div class="d-flex justify-content-center align-items-center mb-3">
				<button @click="prevWeek" class="btn btn-secondary me-2">이전 주</button>
				<h5 class="text-center align-middle">{{ formatWeek(currentWeek) }}</h5>
				<button @click="nextWeek" class="btn btn-secondary ms-2">다음 주</button>
			</div>

			<!-- Weekly Schedule Table -->
			<table class="table table-bordered text-center align-middle">
				<thead>
					<tr>
						<th>Time</th>
						<th v-for="day in weeklySchedules" :key="day.date">
							{{ formatDayWithWeekday(day.date) }}
						</th>
					</tr>
				</thead>
				<tbody>
					<!-- 시간대 (30분 단위) -->
					<tr v-for="timeSlot in timeSlots" :key="timeSlot">
						<td>{{ timeSlot }}</td>
						<!-- 요일별 스케줄 출력 -->
						<td v-for="day in weeklySchedules" :key="day.date" :class="{ 'table-warning': isToday(day.date) }">
							<!-- 시작일 스케줄 -->
							<div v-for="schedule in getStartSchedulesAtTime(day.startSchedules, timeSlot)" :key="schedule.id"
								class="text-success">
								<div @click="openDetailModal(schedule)" class="fw-bold">
									[시작] {{ schedule.title }}
								</div>
							</div>
							<!-- 종료일 스케줄 -->
							<div v-for="schedule in getEndSchedulesAtTime(day.endSchedules, timeSlot)" :key="schedule.id"
								class="text-danger">
								<div @click="openDetailModal(schedule)" class="fw-bold">
									[종료] {{ schedule.title }}
								</div>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<button class="btn btn-secondary me-2" @click="showModal">일정 추가</button>
			</div>
		</div>

		<!-- Monthly View -->
		<div v-if="currentView === 'monthly'">
			<div class="d-flex align-items-center justify-content-center mb-3">
				<button @click="prevMonth" class="btn btn-secondary me-2">이전 달</button>
				<h5 class="text-center align-middle">{{ formatMonth(currentMonth) }}</h5>
				<button @click="nextMonth" class="btn btn-secondary ms-2">다음 달</button>
			</div>

			<div class="monthly-calendar d-flex flex-wrap">
				<!-- 주별 반복 -->
				<div class="week" v-for="week in monthlySchedules" :key="week[0].date">
					<!-- 요일별 반복 -->
					<div class="day flex-grow-1 d-flex flex-column" v-for="day in week" :key="day.date"
						:class="{ 'table-warning': isToday(day.date) }">
						<div class="date">{{ day.date.substring(5) }}</div>

						<!-- 시작일 스케줄 출력 -->
						<div v-for="schedule in day.startSchedules" :key="schedule.id" class="text-start">
							<div @click="openDetailModal(schedule)" class="fw-bold text-success">
								[시작] {{ schedule.title }}
							</div>
						</div>

						<!-- 종료일 스케줄 출력 -->
						<div v-for="schedule in day.endSchedules" :key="schedule.id" class="text-start">
							<div @click="openDetailModal(schedule)" class="fw-bold text-danger">
								[종료] {{ schedule.title }}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="d-flex justify-content-center align-items-center mt-3">
				<button class="btn btn-secondary me-2" @click="showModal">일정 추가</button>
			</div>
		</div>


		<!-- Modal -->
		<div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">상세 일정</h5>
					<button type="button" class="btn-close" @click="closeDetailModal"></button>
				</div>
				<div class="modal-body">
					<p><strong>기간:</strong> {{ formatPeriod(selectedSchedule.startDateTime, selectedSchedule.endDateTime) }}</p>
					<p><strong>제목:</strong> {{ selectedSchedule.title }}</p>
					<p><strong>등록자:</strong> {{ selectedSchedule.name }}</p>
					<p><strong>장소:</strong> {{ selectedSchedule.place }}</p>
					<p><strong>참여자:</strong>{{ selectedSchedule.userNames }}, {{ selectedSchedule.departmentNames }}</p>
					<p><strong>설명:</strong> {{ selectedSchedule.content }}</p>

				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" @click="closeDetailModal">닫기</button>
				</div>
			</div>
		</div>
		<!-- Add Schedule Modal -->
		<div v-if="isModalVisible" class="modal" tabindex="-1" style="display: block; background: rgba(0, 0, 0, 0.5);">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">일정 추가</h5>
						<button type="button" class="btn-close" @click="hideModal"></button>
					</div>
					<div class="modal-body">
						<form @submit.prevent="submitSchedule">
							<div v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</div>
							<div class="mb-3">
								<label for="period" class="form-label">*기간</label>
								<div class="d-flex align-items-center">
									<input type="datetime-local" v-model="formattedStartDateTime" class="form-control me-2"
										@change="handleStartTimeChange" required />
									<span>~</span>
									<input type="datetime-local" v-model="formattedEndDateTime" class="form-control ms-2"
										@change="handleEndTimeChange" required />
								</div>
							</div>
							<div class="mb-3">
								<label for="title" class="form-label">*제목</label>
								<input @input="titleValidate" title="제목은 최대 50자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
									type="text" v-model="newSchedule.title" class="form-control" required />
							</div>
							<div v-if="errors.title" class="text-danger mb-2">{{ errors.title }}</div>
							<div class="mb-3">
								<label for="place" class="form-label">장소</label>
								<input type="text" @input="placeValidate"
									title="장소은 최대 30자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다." v-model="newSchedule.place"
									class="form-control" required />
							</div>
							<div v-if="errors.place" class="text-danger mb-2">{{ errors.place }}</div>
							<div class="mb-3">
								<label for="content" class="form-label">내용</label>
								<textarea @input="contentValidate" title="내용은 최대 1000자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
									v-model="newSchedule.content" class="form-control" rows="3" required></textarea>
							</div>
							<div v-if="errors.content" class="text-danger mb-2">{{ errors.content }}</div>
							<div class="mb-3">
								<label for="users" class="form-label">참여자</label>
								<div class="input-group">
									<input type="text" v-model="searchUser" class="form-control" placeholder="참여자 검색" />
									<button class="btn btn-secondary" type="button" @click="searchForEntities">검색</button>
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
								<div v-if="errors.user" class="text-danger mb-2">{{ errors.user }}</div>
							</div>

							<div class="text-end">
								<button type="submit" class="btn btn-secondary">저장</button>
								<button type="button" class="btn btn-secondary" @click="hideModal">취소</button>
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

export default {
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {

			currentView: 'monthly', // 'monthly', 'weekly', or 'list'
			schedules: [],
			highlightedRow: null,
			totalPages: 0,
			currentPage: 1,
			size: 10,
			isModalVisible: false,
			newSchedule: {
				account: this.userProfile.account,
				startDateTime: '',
				endDateTime: '',
				title: '',
				place: '',
				content: '',
				userId: [],
				departmentId: []
			},
			showDetailModal: false,
			selectedSchedule: {},
			errorMessage: "",
			errors: {},
			searchUser: '',
			searchResults: [],
			currentWeek: new Date(), // 주간 보기 기준 날짜
			currentMonth: new Date(), // 월간 보기 기준 날짜
			timeSlots: [],
			userEntity: [],
			departmentEntity: [],
		};
	},
	created() {
		this.fetchSchedules();
		this.generateTimeSlots();
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
				this.formattedStartDateTime &&
				this.formattedEndDateTime &&
				this.newSchedule.title.trim() !== "" &&
				(this.newSchedule.userId.length > 0 || this.newSchedule.departmentId.length > 0)
			);
		},
		displayedSchedules() {
			// 오늘 날짜 체크
			const todayString = new Date().toDateString();
			const hasTodaySchedule = this.schedules.some(item => {
				return new Date(item.startDateTime).toDateString() === todayString;
			});

			// 오늘 스케줄이 없다면 placeholder 아이템 하나 추가
			if (!hasTodaySchedule) {
				return [
					...this.schedules,
					{
						isPlaceholder: true,
						title: '',
						name: '',
						place: '',
						startDateTime: new Date(),  // 오늘 날짜
						endDateTime: new Date()
					}
				];
			}

			return this.schedules;
		},
		formattedStartDateTime: {
			get() {
				return this.newSchedule.startDateTime;
			},
			set(value) {
				this.newSchedule.startDateTime = value;
			},
		},
		formattedEndDateTime: {
			get() {
				return this.newSchedule.endDateTime;
			},
			set(value) {
				this.newSchedule.endDateTime = value;
			},
		},
		weekDays() {
			return ["일", "월", "화", "수", "목", "금", "토"];
		},


		monthlySchedules() {
			const firstDayOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
			const lastDayOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

			// 월의 시작일을 주의 시작(일요일)으로 이동
			const startOfCalendar = new Date(firstDayOfMonth);
			const dayOffset = startOfCalendar.getDay();
			startOfCalendar.setDate(startOfCalendar.getDate() - dayOffset);

			// 월의 마지막일을 주의 끝(토요일)으로 이동
			const endOfCalendar = new Date(lastDayOfMonth);
			const endDayOffset = 6 - endOfCalendar.getDay();
			endOfCalendar.setDate(endOfCalendar.getDate() + endDayOffset);

			const weeks = [];
			let currentWeek = [];

			// 달력에 표시할 날짜 루프
			for (let day = new Date(startOfCalendar); day <= endOfCalendar; day.setDate(day.getDate() + 1)) {
				const dateString = new Date(day.getTime() - day.getTimezoneOffset() * 60000)
					.toISOString()
					.split("T")[0];

				// 스케줄을 시작일과 종료일로 분리
				const startSchedules = this.schedules.filter((item) => {
					const itemStartDate = new Date(item.startDateTime).toISOString().split("T")[0];
					return itemStartDate === dateString;
				});

				const endSchedules = this.schedules.filter((item) => {
					const itemEndDate = new Date(item.endDateTime).toISOString().split("T")[0];
					return itemEndDate === dateString;
				});

				currentWeek.push({
					date: dateString,
					startSchedules: startSchedules,
					endSchedules: endSchedules,
				});

				// 주가 완료되면 새로운 주 시작
				if (day.getDay() === 6) {
					weeks.push(currentWeek);
					currentWeek = [];
				}
			}

			return weeks;
		},
		weeklySchedules() {
			const startOfWeek = this.getStartOfWeek(this.currentWeek);

			return Array.from({ length: 7 }, (_, i) => {
				const date = new Date(startOfWeek);
				date.setDate(startOfWeek.getDate() + i);

				const dateString = date.toISOString().split("T")[0];

				const startSchedules = this.schedules.filter((item) => {
					return item.startDateTime.split("T")[0] === dateString;
				});

				const endSchedules = this.schedules.filter((item) => {
					return item.endDateTime.split("T")[0] === dateString;
				});

				return {
					date: dateString,
					startSchedules: startSchedules,
					endSchedules: endSchedules,
				};
			});
		},
	},
	methods: {
		titleValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newSchedule.title)) {
				this.errors.title = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else if (this.newSchedule.title.length > 50) {
				this.newSchedule.title = this.newSchedule.title.slice(0, 50);
				this.errors.title = '최대 50자까지만 입력 가능합니다.';
			} else {
				this.errors.title = '';
			}
		},
		placeValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newSchedule.place)) {
				this.errors.place = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else if (this.newSchedule.place.length > 30) {
				this.newSchedule.place = this.newSchedule.place.slice(0, 30);
				this.errors.place = '최대 30자까지만 입력 가능합니다.';
			} else {
				this.errors.place = '';
			}
		},
		contentValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z0-9!@#$%^&*()\s\n]*$/;

			if (!regex.test(this.newSchedule.content)) {
				this.errors.content = '한글, 영문 대소문자와 숫자, !@#$%^&*(), 스페이스바, 다음 줄만 입력 가능합니다.';
			} else if (this.newSchedule.content.length > 1000) {
				this.newSchedule.content = this.newSchedule.content.slice(0, 1000);
				this.errors.content = '최대 1000자까지만 입력 가능합니다.';
			} else {
				this.errors.content = '';
			}
		},
		formatDayWithWeekday(date) {
			if (!date) return "";
			const options = { weekday: 'short', day: 'numeric', month: 'short' };
			return new Date(date).toLocaleDateString('ko-KR', options);
		},
		generateTimeSlots() {
			const slots = [];
			for (let hour = 9; hour < 19; hour++) {
				slots.push(`${hour.toString().padStart(2, '0')}:00`);
				slots.push(`${hour.toString().padStart(2, '0')}:30`);
			}
			this.timeSlots = slots;
		},

		// Filter schedules that fall within a given time slot
		getStartSchedulesAtTime(schedules, timeSlot) {
			const [hour, minute] = timeSlot.split(':').map(Number);
			return schedules.filter(schedule => {
				const start = new Date(schedule.startDateTime);
				return start.getHours() === hour && start.getMinutes() === minute;
			});
		},

		getEndSchedulesAtTime(schedules, timeSlot) {
			const [hour, minute] = timeSlot.split(':').map(Number);
			return schedules.filter(schedule => {
				const end = new Date(schedule.endDateTime);
				end.setMinutes(end.getMinutes() - 30); // 30분 빼기
				return end.getHours() === hour && end.getMinutes() === minute;
			});
		},

		parseFileNames(fileNames) {
			if (!fileNames) return [];
			return fileNames.split(',');
		},
		generateFileUrl(fileName) {
			const serverIp = '/upload';
			return `${serverIp}/${fileName}`;
		},
		openDetailModal(schedule) {
			this.selectedSchedule = schedule;
			this.showDetailModal = true;
		},
		closeDetailModal() {
			this.showDetailModal = false;
			this.selectedSchedule = {};
		},
		isToday(dateTime) {
			const givenDate = new Date(dateTime).toDateString();
			const today = new Date().toDateString();
			return givenDate === today;
		},
		formatMonth(date) {
			return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
		},
		prevMonth() {
			this.currentMonth = new Date(this.currentMonth); // 새로운 객체 생성
			this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
		},
		nextMonth() {
			this.currentMonth = new Date(this.currentMonth); // 새로운 객체 생성
			this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
		},
		formatToAsiaSeoul(date) {
			const koreaOffset = 9 * 60; // +9 hours in minutes
			const localTime = new Date(date.getTime() + koreaOffset * 60 * 1000);
			return localTime.toISOString().slice(0, 16);
		},
		handleStartTimeChange() {
			const koreaOffset = 9 * 60;
			const now = new Date(); // 현재 시간
			const startDateTime = new Date(this.newSchedule.startDateTime);
			const endDateTime = new Date(this.newSchedule.endDateTime);
			const nineAM = new Date(startDateTime);
			nineAM.setHours(9, 0, 0, 0); // 오전 9시

			const sixThirtyPM = new Date(startDateTime);
			sixThirtyPM.setHours(18, 30, 0, 0); // 오후 6시 30분
			// 시작 시간을 가장 가까운 30분으로 조정
			this.adjustToNearestHalfHour("start");

			if (startDateTime < nineAM && startDateTime > sixThirtyPM) {

				this.errorMessage = "시작 시간은 오전 9시에서 6시 30분 까지 선택 가능합니다.";
			} else if (startDateTime >= nineAM && startDateTime <= sixThirtyPM) {
				// 시작 시간이 현재 시간보다 이전인지 확인
				if (startDateTime <= now) {
					this.errorMessage = "시작 시간은 현재 시간보다 이전일 수 없습니다.";
				} else if (!endDateTime && startDateTime > endDateTime) {
					this.errorMessage = "시작 시간은 종료 시간보다 이전이어야 합니다.";
				} else {
					this.errorMessage = "";
				}
			}
		},
		handleEndTimeChange() {
			const now = new Date(); // 현재 시간
			const nowPlus30Min = new Date(now); // 현재 시간을 복사
			nowPlus30Min.setMinutes(now.getMinutes() + 30); // 30분 추가
			const startDateTime = new Date(this.newSchedule.startDateTime);
			const endDateTime = new Date(this.newSchedule.endDateTime);
			const nineAM = new Date(endDateTime);
			nineAM.setHours(9, 0, 0, 0); // 오전 9시

			const sixThirtyPM = new Date(endDateTime);
			sixThirtyPM.setHours(18, 30, 0, 0); // 오후 6시 30분

			this.adjustToNearestHalfHour("end");
			// 종료 시간이 시작 시간보다 이전이거나 같으면 30분 추가


			if (endDateTime < nineAM && endDateTime > sixThirtyPM) {

				this.errorMessage = "종료 시간은 오전 9시에서 오후 6시 30분 까지 선택 가능합니다.";
			} else if (endDateTime >= nineAM && endDateTime <= sixThirtyPM) {
				if (startDateTime >= endDateTime) {
					this.errorMessage = "종료 시간은 시작 시간보다 이후여야 합니다.";
				} else {
					this.errorMessage = "";
				}
			}

		},
		adjustToNearestHalfHour(field) {
			const dateTime = new Date(this.newSchedule[field + "DateTime"]);
			if (isNaN(dateTime)) return;

			// Adjust minutes to the nearest 30-minute mark
			const minutes = dateTime.getMinutes();
			const adjustedMinutes = minutes === 0 ? 0 : minutes <= 30 ? 30 : 60;

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
			this.newSchedule[field + "DateTime"] = localISO;
		},
		getStartOfWeek(date) {
			const result = new Date(date);
			result.setDate(date.getDate() - date.getDay());
			return result;
		},
		formatWeek(date) {
			const start = this.getStartOfWeek(date);
			const end = new Date(start);
			end.setDate(start.getDate() + 6);
			return `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;
		},
		prevWeek() {
			this.currentWeek = new Date(this.currentWeek); // 새로운 객체 생성
			this.currentWeek.setDate(this.currentWeek.getDate() - 7);
		},
		nextWeek() {
			this.currentWeek = new Date(this.currentWeek); // 새로운 객체 생성
			this.currentWeek.setDate(this.currentWeek.getDate() + 7);
		},
		formatPeriod(start, end) {
			const options = {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			};
			return `${new Date(start).toLocaleString("ko-KR", options)} ~ ${new Date(end).toLocaleString("ko-KR", options)}`;
		},
		async viewMonthly() {
			this.currentView = 'monthly';
		},
		viewWeekly() {
			this.currentView = 'weekly';
		},
		viewList() {
			this.currentView = 'list';
		},
		highlightRow(index) {
			this.highlightedRow = index;
		},
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			this.fetchSchedules();
		},
		showModal() {
			this.errors = [];

			this.isModalVisible = true;
			this.errorMessage = "";
		},
		hideModal() {
			this.isModalVisible = false;
			this.resetForm();
		},
		resetForm() {
			this.newSchedule = {
				startDateTime: '',
				endDateTime: '',
				title: '',
				place: '',
				content: '',
				userId: [],
				departmentId: []
			};
			this.searchUser = '';
			this.searchResults = [];
		},
		async fetchSchedules() {
			try {
				const response = await api.get("/schedule/list", {
					params: {
						page: this.currentPage,
						size: this.size,
					}
				});
				this.schedules = response.data.content;
				this.totalPages = response.data.totalPages;
			} catch (error) {
				console.error("Failed to fetch schedules", error);
			}
		},
		async submitSchedule() {
			if (!this.isFormValid) {
				if (this.userEntity.length === 0 && this.departmentEntity.length === 0) {
					this.errors.user = '스케쥴에 참여할 사용자를 추가해주세요.';
					return;
				}

			}
			try {
				await api.post("/schedule/create", this.newSchedule);
				this.userEntity.length = 0;
				this.departmentEntity.length = 0;
				this.hideModal();
				this.fetchSchedules();
			} catch (error) {
				console.error("Failed to create schedule", error);
			}
		},
		async searchForEntities() {
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
				console.error("Failed to search entities", error);
			}
		},
		addEntity(entity) {
			if (entity.type === 'USER' && !this.newSchedule.userId.includes(entity.id)) {
				this.newSchedule.userId.push(entity.id);
				this.userEntity.push(entity);
				console.log(this.userEntity)
			} else if (entity.type === 'DEPARTMENT' && !this.newSchedule.departmentId.includes(entity.id)) {
				this.newSchedule.departmentId.push(entity.id);
				this.departmentEntity.push(entity);
			}
			this.searchResults = null;
			this.searchUser = '';
			this.errors.user = '';
		},
		removeEntity(entity) {
			if (entity.type === 'USER') {
				this.newSchedule.userId = this.newSchedule.userId.filter(userId => userId !== entity.id);
				this.userEntity = this.userEntity.filter(user => user.id !== entity.id);
			} else if (entity.type === 'DEPARTMENT') {
				this.newSchedule.departmentId = this.newSchedule.departmentId.filter(deptId => deptId !== entity.id);
				this.departmentEntity = this.departmentEntity.filter(dept => dept.id !== entity.id);
			}
		}
	},
};
</script>

<style scoped>
.monthly-calendar {
	display: flex;
	flex-wrap: wrap;
	width: 100%;
	border: 1px solid #dee2e6;
	/* 전체 테두리 */
}

.week {
	display: flex;
	width: 100%;
}

.day {
	flex: 1 1 14.285%;
	/* 각 요일이 동일한 비율을 차지 (7일 기준) */
	min-height: 100px;
	/* 최소 높이를 설정하여 빈 날도 공간 차지 */
	border: 1px solid #dee2e6;
	/* 셀 테두리 */
	padding: 5px;
	box-sizing: border-box;
}

.date {
	font-weight: bold;
	margin-bottom: 5px;
}

.table-warning {
	background-color: #fff3cd;
}

.table-warning {
	background-color: #ffc107 !important;
}

.pagination {
	margin: 0;
}

.page-link {
	color: #007bff;
	text-decoration: none;
}

.page-link:hover {
	color: #0056b3;
}

.container {
	max-width: 900px;
}

.modal {
	display: flex;
	justify-content: center;
	align-items: center;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1050;
}

.modal-dialog {
	max-width: 500px;
	margin: 1.75rem auto;
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-content {
	background: white;
	padding: 20px;
	border-radius: 8px;
	width: 400px;
	max-width: 90%;
}

.cursor-pointer {
	cursor: pointer;
}

.btn-group .btn {
	width: 150px;
}

.btn-group .btn.active {
	background-color: #6c757d;
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
