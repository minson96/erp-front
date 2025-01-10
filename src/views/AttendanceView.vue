<template>
	<div class="container mt-4">
		<!-- 에러 메시지 -->
		<div v-if="errorMessage" class="alert alert-danger" role="alert">
			{{ errorMessage }}
		</div>
		<!-- 로딩 스피너 -->
		<div v-if="isLoading" class="text-center my-4">
			<div class="spinner-border" role="status">
				<span class="sr-only">로딩 중...</span>
			</div>
		</div>

		<!-- 검색 및 필터 섹션 -->
		<div class="row mb-3">
			<div class="col-md-6">
				<div class="btn-group" role="group" aria-label="Reason filter">
					<button v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD')" type="button"
						class="btn btn-outline-secondary" :class="{ active: activeTab === 'list' }" @click="setActiveTab('list')"
						:disabled="activeTab === 'list'">
						결제 목록
					</button>
					<button v-if="userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'HOD')" type="button"
						class="btn btn-outline-secondary" :class="{ active: activeTab === 'waitList' }"
						@click="setActiveTab('waitList')" :disabled="activeTab === 'waitList'">
						미승인된 결제
					</button>
					<button type="button" class="btn btn-outline-secondary" :class="{ active: activeTab === 'myList' }"
						@click="setActiveTab('myList')" :disabled="activeTab === 'myList'">
						내가 신청한 결제
					</button>
				</div>
			</div>
		</div>

		<!-- 출석 기록 테이블 -->
		<div class="table-responsive" v-if="!isLoading && !errorMessage">
			<table class="table table-bordered table-striped">
				<thead class="thead-dark">
					<tr>
						<th v-if="activeTab !== 'myList'">신청자</th>
						<th>시작 시간</th>
						<th>종료 시간</th>
						<th>사유</th>
						<!-- <th>설명</th> -->
						<th>상태</th>
						<th v-if="activeTab === 'waitList'">승인</th>
						<th v-if="activeTab === 'waitList'">반려</th>
						<th v-if="activeTab === 'myList'">퇴근</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="attendance in attendanceList" :key="attendance.id">
						<td v-if="activeTab !== 'myList'">{{ attendance.name }}</td>
						<td>{{ formatDate(attendance.startDateTime, attendance.reason) }}</td>
						<td>{{ formatDate(attendance.endDateTime, attendance.reason) }}</td>
						<td>{{ formatReason(attendance.reason) }}</td>
						<!-- <td>{{ attendance.description }}</td> -->
						<td>{{ formatStatus(attendance.status) }}</td>
						<td v-if="activeTab === 'waitList'">
							<button class="btn btn-secondary btn-sm" @click="approveAttendance(attendance.id)">승인</button>
						</td>
						<td v-if="activeTab === 'waitList'">
							<button class="btn btn-secondary btn-sm" @click="denyAttendance(attendance.id)">반려</button>
						</td>
						<td v-if="activeTab === 'myList' && (attendance.reason === 'ATTENDANCE' || attendance.reason === 'TARDINESS') &&
							!attendance.endDateTime">
							<button class=" btn btn-secondary btn-sm" @click="leaveWork(attendance)">퇴근</button>
						</td>
					</tr>
					<tr v-if="attendanceList.length === 0">
						<td v-if="activeTab !== 'waitList'" colspan="5" class="text-center">데이터가 없습니다.</td>
						<td v-else colspan="7" class="text-center">데이터가 없습니다.</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="row mb-3">
			<div class="col-md-4">
				<select class="form-control" v-model="searchTerm" @change="onReasonChange">
					<option value="">모두</option>
					<option value="VACATION">휴가</option>
					<option value="BUSINESS_TRIP">출장</option>
					<option value="TARDINESS">지각</option>
					<option value="WORKING_OUTSIDE">외근</option>
					<option value="LEAVING_EARLY">조퇴</option>
					<option value="ABSENTEEISM">결근</option>
					<option value="TARDY_AND_LEAVING_EARLY">지각, 조퇴</option>
				</select>
			</div>
		</div>
		<!-- 페이징 컨트롤 -->
		<nav v-if="totalPages > 1 && !isLoading && !errorMessage" aria-label="Page navigation">
			<ul class="pagination justify-content-center">
				<li class="page-item" :class="{ disabled: currentPage === 1 }" @click="changePage(currentPage - 1)">
					<a class="page-link" href="javascript:void(0)">이전</a>
				</li>
				<li class="page-item" v-for="page in pages" :key="page" :class="{ active: currentPage === page }"
					@click="changePage(page)">
					<a class="page-link" href="javascript:void(0)">{{ page }}</a>
				</li>
				<li class="page-item" :class="{ disabled: currentPage === totalPages }" @click="changePage(currentPage + 1)">
					<a class="page-link" href="javascript:void(0)">다음</a>
				</li>
			</ul>
		</nav>

		<!-- 새 출석 기록 추가 버튼 -->
		<div class="text-end my-3">
			<button v-if="activeTab === 'myList'" class="btn btn-primary" @click="attendanceRegit"
				:disabled="hasAlreadyCheckedIn()">출근</button>

			<button class="btn btn-primary" @click="showModal">신청</button>
		</div>

		<!-- Add Attendance Modal -->
		<div v-if="isModalVisible" class="modal" tabindex="-1" style="display: block; background: rgba(0, 0, 0, 0.5);">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">신청</h5>
						<button type="button" class="btn-close" @click="hideModal"></button>
					</div>
					<div class="modal-body">
						<form @submit.prevent="submitAttendance">
							<div v-if="modalErrorMessage" class="alert alert-danger">{{ modalErrorMessage }}</div>

							<div class="mb-3">
								<label class="form-label">*사유</label>
								<select class="form-control" v-model="newAttendance.reason" required>
									<option disabled value="">사유 선택</option>
									<option value="VACATION">휴가</option>
									<option value="BUSINESS_TRIP">출장</option>
									<option value="WORKING_OUTSIDE">외근</option>

								</select>
							</div>

							<div class="mb-3">
								<label class="form-label">*시작 날짜</label>
								<input type="date" v-model="newAttendance.startDateTime" :min="today" class="form-control" required />
							</div>

							<div class="mb-3">
								<label class="form-label">*종료 날짜</label>
								<input type="date" v-model="newAttendance.endDateTime" :min="newAttendance.startDateTime || today"
									class="form-control" required />
							</div>



							<!-- <div class="mb-3">
								<label class="form-label">설명</label>
								<textarea v-model="newAttendance.description" class="form-control" rows="3"></textarea>
							</div> -->

							<!-- 필요하다면 department_id는 자동으로 설정하거나 숨겨진 필드로 처리 -->
							<!-- 여기서는 userProfile이나 다른 논리를 통해 department_id를 설정한다고 가정 -->

							<div class="text-end">
								<button type="submit" class="btn btn-primary">저장</button>
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
import api from "@/axios";

export default {
	name: "AttendanceList",
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			today: "",
			attendanceList: [],
			currentPage: 1,
			pageSize: 10,
			totalRecords: 0,
			searchTerm: "",
			departmentId: null,
			isLoading: false,
			errorMessage: "",
			activeTab: "",
			// 모달 관련 데이터
			isModalVisible: false,
			modalErrorMessage: "",
			newAttendance: {
				startDateTime: "",
				endDateTime: "",
				reason: "",
				description: "",
				status: ""
				// departmentId는 필요 시 여기에 추가하거나, 백엔드에서 설정
			},
			list: [],
			waitList: [],
			myList: [],
		};
	},
	computed: {

		totalPages() {
			return Math.ceil(this.totalRecords / this.pageSize);
		},
		pages() {
			const pages = [];
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
			return pages;
		},
		activeList() {
			if (this.activeTab === "list") return this.attendanceList;
			if (this.activeTab === "waitList") return this.attendanceList;
			if (this.activeTab === "mylist") return this.attendanceList;
			return [];
		},
	},
	created() {
		const now = new Date();
		const seoulNow = new Date(
			now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
		);

		// Asia/Seoul 기준 오늘 날짜를 YYYY-MM-DD 형식으로 얻기
		this.today = seoulNow.toLocaleDateString("en-CA"); // en-CA는 YYYY-MM-DD 형식을 반환

		if (this.userProfile && this.userProfile.role === 'USER') {
			this.activeTab = 'myList'
		} else {
			this.activeTab = 'list'
		}
		this.fetchAttendance(this.activeTab);
	},
	methods: {
		hasAlreadyCheckedIn() {
			const seoulNow = new Date(
				new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
			);
			const today = seoulNow.toISOString().split('T')[0]; // YYYY-MM-DD 형식

			return this.attendanceList.some(att => {
				// startDateTime과 endDateTime을 Asia/Seoul 시간대로 변환
				const startSeoulDate = new Date(
					new Date(att.startDateTime).toLocaleString("en-US", { timeZone: "Asia/Seoul" })
				).toISOString().split('T')[0];
				const endSeoulDate = new Date(
					new Date(att.endDateTime).toLocaleString("en-US", { timeZone: "Asia/Seoul" })
				).toISOString().split('T')[0];

				console.log(`${startSeoulDate} ~ ${endSeoulDate} 비교: ${today}`);

				// today가 startDateTime과 endDateTime 사이에 포함되어 있는지 확인
				return startSeoulDate <= today && today <= endSeoulDate;
			});
		},
		async approveAttendance(attendanceId) {
			await api.post('/attendance/approve', null, {
				params: {
					attendanceId: attendanceId
				}
			})
				.then((response) => {
					console.log(response.data)
				});
			this.fetchAttendance(this.activeTab);
		},
		async denyAttendance(attendanceId) {
			await api.post('/attendance/deny', null, {
				params: {
					attendanceId: attendanceId
				}
			})
				.then((response) => {
					console.log(response.data)
				});
			this.fetchAttendance(this.activeTab);
		},
		setActiveTab(tab) {
			this.activeTab = tab;
			this.searchTerm = "";
			this.fetchAttendance(tab); // 해당 탭에 맞는 데이터를 다시 불러옴
		},

		async fetchAttendance(tab) {
			const params = {
				departmentId: this.userProfile.departmentId,
				offset: (this.currentPage - 1) * this.pageSize,
				size: this.pageSize,
				search: this.searchTerm,
			};

			this.isLoading = true;
			this.errorMessage = "";

			await api
				.get(`/attendance/${tab}`, { params })
				.then((response) => {
					this.attendanceList = response.data.content;
					// if (tab === "list") this.list = response.data.content;
					// if (tab === "waitList") this.waitList = response.data.content;
					// if (tab === "myList") this.myList = response.data.content;
					this.totalRecords = response.data.totalElements;
				})
				.catch((error) => {
					console.error("출석 기록을 불러오는 중 오류 발생:", error);
					this.errorMessage = "출석 기록을 불러오는 중 오류가 발생했습니다.";
				})
				.finally(() => {
					this.isLoading = false;
				});
		},
		changePage(page) {
			if (page < 1 || page > this.totalPages) return;
			this.currentPage = page;
			this.fetchAttendance(this.activeTab);
		},
		onReasonChange() {
			console.log(this.searchTerm);
			this.currentPage = 1;
			this.fetchAttendance(this.activeTab);
		},
		formatDate(dateTime, reason) {
			if (!dateTime) return "-";

			// 입력 값이 단순 날짜 형식인지 확인 (예: "2023-01-01")
			// const isDateOnly = typeof dateTime === 'string' && dateTime.length <= 10;

			const date = new Date(dateTime);

			if (reason === 'VACATION' || reason === 'WORKING_OUTSIDE' || reason === 'BUSINESS_TRIP') {
				// 시간 정보 없이 날짜만 있는 경우
				return date.toLocaleDateString();  // 지역 설정에 따른 날짜 형식 반환
			} else {
				// 날짜와 시간이 모두 포함된 경우
				return date.toLocaleString();     // 지역 설정에 따른 날짜 및 시간 형식 반환
			}
		},
		formatStatus(status) {
			const statusMap = {
				APPROVE: '승인',
				DENY: '반려',
				WAIT: '대기 중',
				NOT_APPLICABLE: '자동 승인'
			};
			return statusMap[status] || status;
		},
		formatReason(reason) {
			const reasonMap = {
				VACATION: '휴가',
				BUSINESS_TRIP: '출장',
				TARDINESS: '지각',
				WORKING_OUTSIDE: '외근',
				LEAVING_EARLY: '조퇴',
				ABSENTEEISM: '결근',
				ATTENDANCE: '출근',
				TARDY_AND_LEAVING_EARLY: '지각, 조퇴'
			};
			return reasonMap[reason] || reason;
		},
		statusBadgeClass(status) {
			switch (status) {
				case "APPROVE":
					return "badge badge-success";
				case "DENY":
					return "badge badge-danger";
				case "WAIT":
					return "badge badge-warning";
				default:
					return "badge badge-secondary";
			}
		},

		// 모달 관련 메서드
		showModal() {
			this.isModalVisible = true;
			this.modalErrorMessage = "";
			// 새로운 출석 기록 데이터 초기화
			this.newAttendance = {
				startDateTime: "",
				endDateTime: "",
				reason: "",
				description: "",
				status: "WAIT"
			};
		},
		hideModal() {
			this.isModalVisible = false;
		},
		submitAttendance() {
			const formatDateToISO = (date) => {
				// 날짜에 'T'가 없으면 ISO-8601 형식으로 변환
				if (!date.includes("T")) {
					return `${date}T00:00:00`;
				}
				return date; // 이미 시간 정보가 있는 경우 그대로 반환
			};

			const payload = {
				...this.newAttendance,
				startDateTime: formatDateToISO(this.newAttendance.startDateTime),
				endDateTime: formatDateToISO(this.newAttendance.endDateTime),
				status: "WAIT",
				departmentId: this.userProfile.departmentId, // 부서 ID 추가
			};

			api
				.post("/attendance/save", payload)
				.then(() => {
					this.hideModal();
					this.fetchAttendance(this.activeTab); // 목록 갱신
				})
				.catch((error) => {
					this.modalErrorMessage = "이미 등록된 일정이 있습니다.";
				});
		},
		attendanceRegit() {
			const seoulNow = new Date(
				new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
			);
			const reasonValue = seoulNow.getHours() >= 9 ? "TARDINESS" : "ATTENDANCE";
			// 필요한 경우 유효성 검사 추가 가능
			const payload = {
				startDateTime: seoulNow.toISOString(),
				endDateTime: "",
				reason: reasonValue,
				description: "",
				status: "NOT_APPLICABLE",
				departmentId: this.userProfile.departmentId  // 부서 ID 추가
			};

			api.post("/attendance/save", payload)
				.then(() => {
					this.fetchAttendance(this.activeTab);  // 목록 갱신
				})
				.catch(error => {
					console.error("출석 기록 저장 오류:", error);
					this.modalErrorMessage = "출석 기록 저장 중 오류가 발생했습니다.";
				});
		},
		leaveWork(attendance) {
			const seoulNow = new Date(
				new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
			);
			const currentHour = seoulNow.getHours(); // 현재 시간을 기준으로 조건 처리

			// reason 설정 로직
			let reason = attendance.reason;

			if (attendance.reason === "TARDINESS") {
				reason = currentHour < 18 ? "TARDY_AND_LEAVING_EARLY" : "TARDINESS";
			} else if (attendance.reason === "ATTENDANCE") {
				reason = currentHour < 18 ? "LEAVING_EARLY" : "ATTENDANCE";
			}

			// Payload 생성
			const payload = {
				attendanceId: attendance.id,
				reason: reason,
				endDateTime: seoulNow.toISOString(),
			};

			// API 호출
			api
				.post("/attendance/leaveWork", payload)
				.then(() => {
					this.fetchAttendance(this.activeTab); // 목록 갱신
				})
				.catch((error) => {
					console.error("출석 기록 저장 오류:", error);
					this.modalErrorMessage = "출석 기록 저장 중 오류가 발생했습니다.";
				});
		}
	},
	// mounted() {
	// 	this.fetchAttendance();
	// },
};
</script>


<style scoped>
.table-responsive {
	max-height: 600px;
}

.badge {
	font-size: 0.9em;
}

.spinner-border {
	width: 3rem;
	height: 3rem;
}

.alert {
	margin-top: 20px;
}
</style>
