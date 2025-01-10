<template>
	<div class="container-fluid mt-4 d-flex">

		<div class="tree-container border me-3 p-2" style="height: calc(100vh - 210px); width: 300px; overflow-x: auto">
			<div class="tree-controls d-flex justify-content-between mb-3">
				<button class="btn btn-outline-secondary btn-sm" @click="expandAll">펼치기</button>
				<button class="btn btn-outline-secondary btn-sm" @click="collapseAll">접기</button>
			</div>
			<ul class="tree" style="list-style: none; margin: 0; padding: 0;">
				<DepartmentItem v-for="department in departments" :key="department.id" :department="department"
					@toggle-department="handleToggleDepartment" :user-profile="userProfile" @add-sub-department="addSubDepartment"
					@remove-department="removeDepartment" :members="members" @fetch-members="handleFetchMembers" />
			</ul>

			<div class="tree-controls d-flex justify-content-between mt-3">
				<button class="btn btn-outline-secondary btn-sm" @click="sendMessageToSelected">쪽지</button>
				<button class="btn btn-outline-secondary btn-sm" @click="createMessengerGroup()">메신저</button>
			</div>
		</div>

		<div class="table-container flex-grow-1">
			<table class="table table-bordered text-center">
				<thead>
					<tr>
						<th>선택</th>
						<th>이름</th>
						<th v-if="userProfile && userProfile.role === 'ADMIN'">상태</th>
						<th>직책</th>
						<th>소속</th>
						<!-- <th>번호</th>
						<th>메일</th> -->
					</tr>
				</thead>
				<tbody>
					<tr v-for="member in members" :key="member.id">
						<td>
							<input type="checkbox" v-model="selectedMembers" :value="member" />
						</td>
						<td @click="memberModal(member)" class="text-primary" style="cursor:pointer;">{{ member.name }}</td>
						<td v-if="userProfile && userProfile.role === 'ADMIN'">{{ member.status === 'APPROVED' ? '승인' : '미승인' }}
						</td>
						<td>{{ member.positionName || 'N/A' }}</td>
						<td>{{ member.departmentName }}</td>
						<!-- <td>{{ member.phoneNumber || 'N/A' }}</td>
						<td>{{ member.email }}</td> -->
					</tr>
				</tbody>
			</table>
			<div class="d-flex justify-content-center align-items-center mt-4">
				<input type="text" v-model="searchQuery" placeholder="검색이 필요한 구성원 이름을 입력" class="form-control w-auto me-2" />
				<button class="btn btn-secondary me-2" @click="search">검색</button>
				<button class="btn btn-secondary me-2" @click="postMessage(selectedMembers)">쪽지</button>
				<button class="btn btn-secondary me-2" @click="messageInvite(selectedMembers)">메신저</button>
				<button v-if="userProfile && userProfile.role === 'ADMIN'" class="btn btn-secondary me-2"
					@click="deleteSelected">삭제</button>
				<button v-if="userProfile && userProfile.role === 'ADMIN'" class="btn btn-secondary me-2"
					@click="approveMembers">가입 승인</button>
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
		<!-- 모달 영역 -->
		<div class="modal fade" id="memberModal" tabindex="-1" aria-labelledby="memberModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-lg modal-dialog-centered">
				<div class="modal-content p-3">
					<!-- 모달 헤더 -->
					<div class="modal-header">
						<!-- 필요하다면 닫기 버튼 추가 -->
						<!--
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        -->
					</div>

					<!-- 모달 바디 -->
					<div class="modal-body scrollable-content">
						<!-- container 로 감싸고, row-col 시스템으로 정렬 -->
						<div class="container">
							<div class="row">
								<!-- 프로필 사진 영역 -->
								<div class="col-md-3 text-center">
									<div
										class="border rounded-circle overflow-hidden d-flex align-items-center justify-content-center mx-auto"
										style="width:100px; height:100px;">
										<img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile Preview"
											class="w-100 h-100 object-fit-cover" />
										<img v-else-if="selectedMemberForm.storedFileName"
											:src="`/upload/${selectedMemberForm.storedFileName}`" alt="Profile Preview"
											class="w-100 h-100 object-fit-cover" />
										<!-- <span v-else class="d-inline-block w-100 h-100" style="line-height: 100px;">
											사진
										</span> -->
										<i v-else class="bi bi-person" style="font-size: 3rem;"></i>
									</div>

									<!-- ADMIN 권한이 있을 때만 파일 업로드 버튼 노출 -->
									<div class="d-flex justify-content-center align-items-center mt-3">
										<!-- label에 for 속성을 통해 input의 id를 연결해줍니다. -->
										<label for="profileImage" class="btn btn-secondary" style="cursor: pointer;">
											사진 변경
										</label>

										<!-- 실제 파일 input은 화면에서 보이지 않게 숨깁니다. -->
										<input id="profileImage" ref="profileImage" type="file" accept=".jpg, .jpeg, .png"
											@change="previewImage" style="display: none;" />
									</div>
								</div>

								<!-- 사용자 정보 입력 영역 -->
								<div class="col-md-9">
									<!-- 아이디 -->
									<div class="row mb-2">
										<div class="col-3 fw-bold">아이디</div>
										<div class="col-9">
											{{ selectedMemberForm?.account || '' }}
										</div>
									</div>

									<!-- 이름 -->
									<div class="row mb-2">
										<div class="col-3 fw-bold">이름</div>
										<div class="col-9">
											{{ selectedMemberForm?.name || '' }}
										</div>
									</div>

									<!-- 메일 -->
									<div class="row mb-2">
										<div class="col-3 fw-bold">메일</div>
										<div class="col-9">
											<input v-if="userProfile && userProfile.role === 'ADMIN'" @input="emailValidate"
												title="이메일은 최대 50자로 영어 대소문자, 숫자, '.', '@'을 포함해야 합니다." v-model="selectedMemberForm.email"
												class="form-control" />
											<div v-else>
												{{ selectedMemberForm?.email || '' }}
											</div>
										</div>
									</div>

									<!-- 부서 -->
									<div class="row mb-2">
										<div v-if="userProfile && userProfile.role === 'ADMIN'" class="d-flex align-items-center">
											<label for="department" class="form-label fw-bold col-3">부서</label>
											<div class="col-9">
												<select id="department" v-model="department" class="form-select"
													style="max-height: 200px; overflow-y: auto;">
													<option value="">부서</option>
													<option v-for="dept in subDepartments" :key="dept.id" :value="dept.id">
														{{ dept.name }}
													</option>
												</select>
											</div>
										</div>
										<div v-else class="row">
											<div class="col-3 fw-bold">부서</div>
											<div class="col-9">
												{{ selectedDepartmentName }}
											</div>
										</div>
									</div>

									<!-- 직위 -->
									<div class="row mb-2">
										<div v-if="userProfile && userProfile.role === 'ADMIN'" class="d-flex align-items-center">
											<label for="position" class="form-label fw-bold col-3">직위</label>
											<div class="col-9">
												<select id="position" v-model="position" class="form-select">
													<option value="">직위</option>
													<option v-for="pos in positions" :key="pos.id" :value="pos.id">
														{{ pos.title }}
													</option>
												</select>
											</div>
										</div>
										<div v-else class="row">
											<div class="col-3 fw-bold">직위</div>
											<div class="col-9">
												{{ selectedPositionTitle }}
											</div>
										</div>
									</div>

									<!-- 회사 전화번호 -->
									<div class="row mb-2">
										<div class="col-3 fw-bold">회사전화번호</div>
										<div class="col-9">
											<input v-if="userProfile && userProfile.role === 'ADMIN'"
												v-model="selectedMemberForm.companyNumber" class="form-control" />
											<div v-else>
												{{ selectedMemberForm.companyNumber }}
											</div>
										</div>
									</div>

									<!-- 휴대전화번호 -->
									<div class="row mb-2">
										<div class="col-3 fw-bold">휴대전화번호</div>
										<div class="col-9">
											<input v-if="userProfile && userProfile.role === 'ADMIN'" v-model="selectedMemberForm.phoneNumber"
												class="form-control" />
											<div v-else>
												{{ selectedMemberForm.phoneNumber }}
											</div>
										</div>
									</div>
								</div><!-- // col-md-9 -->
							</div><!-- // row -->
						</div><!-- // container -->
					</div><!-- // modal-body -->

					<!-- 모달 푸터 -->
					<div class="modal-footer">
						<button v-if="userProfile && userProfile.role === 'ADMIN'" type="button" class="btn btn-outline-secondary"
							@click="saveMemberInfo">
							개인 정보 수정
						</button>
					</div>
				</div>
			</div>
		</div>

	</div>

</template>

<script>
import api from '@/axios';
import DepartmentItem from './DepartmentItem.vue';
import { reactive } from 'vue';
import { Modal } from 'bootstrap';


export default {
	name: 'organization',
	emits: ['createMessengerGroupSuccess', 'createMembersMessangerSuccess'],
	computed: {
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
		selectedDepartmentName() {
			// department가 null 또는 undefined일 경우 처리
			if (!this.department) return null;

			// subDepartments에서 department에 해당하는 name 찾기
			const selected = this.subDepartments.find(dept => dept.id === this.department);
			return selected ? selected.name : null;
		},
		selectedPositionTitle() {
			// position이 null 또는 undefined일 경우 처리
			if (!this.position) return null;

			// positions 배열에서 position과 id가 일치하는 title 찾기
			const selected = this.positions.find(pos => pos.id === this.position);
			return selected ? selected.title : null;
		},
	},
	components: { DepartmentItem },
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			checkedDepartments: [],
			error: {},
			subDepartments: [],
			positions: [],
			selectedMemberForm: [],
			departments: reactive([]),
			members: [],
			selectedMembers: [],
			selectedDepartment: [],
			searchQuery: '',
			totalPages: 1,
			currentPage: 1,
			pageSize: 10,
			profileImageUrl: '',
			department: '',
			position: '',
			rootDepartment: [],
		};
	},
	async created() {
		console.log(this.userProfile)
		await this.fetchDepartments();
		this.fetchMembers();
	},
	methods: {
		removeDepartmentMembersRecursively(department) {
			// 현재 부서 멤버 제거
			this.members = this.members.filter(m => m.departmentId !== department.id);

			// 하위 부서가 있다면 재귀 호출
			if (Array.isArray(department.subDepartments)) {
				department.subDepartments.forEach(subDept => {
					this.removeDepartmentMembersRecursively(subDept);
				});
			}
		},
		isDepartmentSelected(department) {

			return this.selectedDepartment.includes(department);
		},
		expandAll() {
			this.departments.forEach(department => {
				this.toggleExpandCollapse(department, true);
			});
		},
		// 모든 부서를 접기
		collapseAll() {
			this.departments.forEach(department => {
				this.toggleExpandCollapse(department, false);
			});
		},
		toggleExpandCollapse(department, expanded) {
			department.expanded = expanded;
			if (department.subDepartments && department.subDepartments.length) {
				department.subDepartments.forEach(subDept => {
					this.toggleExpandCollapse(subDept, expanded);
				});
			}
		},
		emailValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9@.]*$/;

			if (!regex.test(this.email)) {
				this.email = this.email.replace(/[^A-Za-z0-9@.]/g, ''); // 허용된 문자만 남김
				this.errors.email = '영문과 숫자, ".", "@"만 입력 가능합니다.';
			} else {
				this.errors.email = '';
			}

			// 최대 길이 제한
			if (this.email.length > 50) {
				this.email = this.email.slice(0, 50);
				this.errors.email = '최대 50자까지만 입력 가능합니다.';
			}
		},
		async messageInvite(members) {
			if (!members || members.length === 0) {
				alert('쪽지를 보낼 사용자를 체크해주세요.')
				return;
			}
			const memberIds = members.map(member => member.id);
			console.log(memberIds);
			await api.post('/room/inviteUsers', {
				userIds: memberIds
			})
			alert('선택하신 사용자에 대해 그룹 메신저가 생성되었습니다.')
			this.$emit('createMembersMessangerSuccess');
			this.selectedMembers = [];
		},

		async createMessengerGroup() {
			if (this.checkedDepartments.length === 0) {
				alert('메신저를 보낼 부서를 체크해주세요.');
				return;
			}
			try {
				const departmentIds = this.checkedDepartments.map(dept => dept.id);
				console.log(departmentIds)
				await api.post('/room/inviteDepartments', {
					departmentsIds: departmentIds, // 서버 요구사항에 맞게 key 설정
				});
				alert('선택하신 부서에 대해 그룹 메신저가 생성되었습니다.');
				this.checkedDepartments = []; // 선택 초기화
				this.selectedDepartment = [];

				this.uncheckAllDepartments(this.departments);
				this.$emit('createMessengerGroupSuccess');
			} catch (error) {
				console.error(error);
				alert('메신저 그룹 생성 중 오류가 발생했습니다.');
			}
		},
		uncheckAllDepartments(departments) {
			if (!departments || !Array.isArray(departments)) return;

			departments.forEach(dept => {
				// 체크 해제
				dept.checked = false;

				// 하위 부서도 재귀로 해제
				if (dept.subDepartments && dept.subDepartments.length) {
					this.uncheckAllDepartments(dept.subDepartments);
				}
			});
		},
		handleToggleDepartment(department) {

			const index = this.selectedDepartment.findIndex((dept) => dept.id === department.id);
			if (index === -1) {
				this.selectedDepartment.push(department); // 추가
			} else {
				this.selectedDepartment.splice(index, 1); // 제거
			}
		},
		postMessage() {
			console.log(this.selectedMembers)
			if (!this.selectedMembers || this.selectedMembers.length === 0) {
				alert('쪽지를 보낼 사용자를 체크해주세요.')
				return;
			}

			const participants = [];
			this.selectedMembers.forEach(user => {
				participants.push({ id: user.id, name: user.name, account: user.account, type: 'USER' });
			});
			this.$router.push({
				name: 'postmessage', // 이동할 라우트 이름
				query: {
					participant: JSON.stringify(participants) // 데이터를 문자열로 전달
				}
			});
			alert('선택하신 사용자를 쪽지 수신자로 지정했습니다.')
			this.selectedMembers = [];
		},
		sendMessageToSelected() {
			if (this.checkedDepartments.length === 0) {
				alert('쪽지를 보낼 부서를 체크해주세요.');
				return;
			}
			const participants = [];
			this.checkedDepartments.forEach(deptId => {
				participants.push({ id: deptId.id, name: deptId.name, type: 'DEPARTMENT' });
			});
			this.$router.push({
				name: 'postmessage', // 이동할 라우트 이름
				query: {
					participant: JSON.stringify(participants)
				}
			});
			alert('선택하신 사용자/부서를 쪽지 수신자로 지정했습니다.');
			this.checkedDepartments = [];
		},
		getEmptySubDepartments(departments) {
			let emptySubDepartments = [];

			function findEmptySubDepartments(depts) {
				depts.forEach(dept => {
					if (dept.subDepartments.length === 0) {
						emptySubDepartments.push(dept);
					}
					if (dept.subDepartments.length > 0) {
						findEmptySubDepartments(dept.subDepartments);
					}
				});
			}

			findEmptySubDepartments(departments);
			return emptySubDepartments;
		},
		async fetchDepartments2() {
			try {
				const response = await api.get('/department/list', {
					params: { companyId: this.userProfile.companyId }
				});

				// console.log(response)
				if (response && response.data) {
					// 전체 부서 리스트에서 하위 부서가 비어있는 부서들만 필터링
					this.subDepartments = this.getEmptySubDepartments(response.data);
				}
			} catch (error) {
				console.error('Failed to fetch departments:', error);
			}
		},

		async fetchJobPostions() {
			try {
				const response = await api.get('/position/list', {
					params: { companyId: this.userProfile.companyId }
				});
				console.log(response)
				this.positions = response.data;
			} catch (error) {
				console.error('Error fetching departments:', error);
			}
		},
		memberModal(member) {
			this.profileImageUrl = '';
			this.fetchDepartments2();
			this.fetchJobPostions();
			this.showMemberModal(member);
		},
		async showMemberModal(member) {
			this.selectedMember = member;

			const response = await api.get('user/userInfo', {
				params: {
					account: member.account
				}
			})
			this.position = member.position;
			this.department = member.departmentName;

			this.selectedMemberForm = {
				id: member.id,
				account: member.account,
				name: member.name,
				email: member.email,
				departmentName: member.departmentName,
				positionName: member.positionName !== 'N/A' ? member.positionName : '',
				phoneNumber: member.phoneNumber !== 'N/A' ? member.phoneNumber : '',
				companyNumber: response.data.companyNumber,
				storedFileName: member.storedFileName
			};

			this.department = member.departmentId;
			this.position = member.positionId;
			// Bootstrap 5 Modal show
			let modal = new Modal(document.getElementById('memberModal'));
			modal.show();
		},
		async saveMemberInfo() {
			const formData = new FormData();
			formData.append('id', this.selectedMemberForm.id);
			formData.append('departmentId', this.department);
			formData.append('account', this.selectedMemberForm.account);
			formData.append('positionId', this.position);
			formData.append('email', this.selectedMemberForm.email);
			formData.append('profileImg', this.$refs.profileImage.files[0]);
			formData.append('phoneNumber', this.selectedMemberForm.phoneNumber);
			formData.append('companyNumber', this.selectedMemberForm.companyNumber);
			await api.post('/user/update', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			alert('개인 정보가 수정되었습니다.');
			document.querySelector('#memberModal .btn-close').click();
			this.fetchMembers();
		},
		async fetchDepartments() {
			try {
				const response = await api.get('department/list', {
					params: { companyId: this.userProfile.companyId },
				});

				this.departments = this.processDepartments(response.data);
				const rootDepartment = this.departments.find(
					department => !department.parentId // parentId가 없거나 null인 경우
				);
				if (rootDepartment) {
					this.rootDepartment = rootDepartment;
					console.log('Root Department ID:', this.rootDepartment);
				} else {
					console.warn('No root department found.');
				}
			} catch (error) {
				console.error('Error fetching departments:', error);
			}
		},

		processDepartments(departments) {
			if (!departments || !Array.isArray(departments)) return [];
			return departments.map(department => ({
				...department,
				expanded: false, // 초기 상태는 접힘
				showAddInput: false, // 하위 부서 입력창 숨김
				newSubDepartmentName: '', // 입력된 새 하위 부서 이름
				subDepartments: department.subDepartments
					? this.processDepartments(department.subDepartments)
					: [], // 재귀적으로 하위 부서 처리
			}));
		},
		async fetchMembers() {
			try {
				const response = await api.get('user/adminsList', {
					params: {
						page: this.currentPage,
						size: this.pageSize,
						search: this.searchQuery,
						departmentId: this.rootDepartment.id,
					},
				});
				this.members = response.data.content.map(member => ({
					id: member.id,
					account: member.account,
					name: member.name,
					status: member.status,
					positionId: member.positionId,
					positionName: member.positionName || 'N/A',
					departmentId: member.departmentId,
					departmentName: member.departmentName,
					email: member.email,
					phoneNumber: member.phoneNumber || 'N/A',
					storedFileName: member.profileImg
				}));
				this.totalPages = response.data.totalPages;
			} catch (error) {
				console.error('Error fetching members:', error);
			}
		},
		async addSubDepartment(department) {
			if (!department.newSubDepartmentName.trim()) {
				alert('하위 부서 이름을 입력하세요.');
				return;
			}
			try {
				const response = await api.post('department/create', {
					parentId: department.id,
					name: department.newSubDepartmentName,
					companyId: this.userProfile.companyId
				});
				const newDept = {
					...response.data,
					expanded: false,
					showAddInput: false,
					subDepartments: [],
				};
				this.fetchDepartments();
				department.subDepartments.push(newDept);
				department.newSubDepartmentName = '';
			} catch (error) {
				console.error('Error adding sub-department:', error);
			}
		},
		handleFetchMembers({ department, isChecked }) {
			if (isChecked) {
				// 부서 전체 객체가 없는 경우 push
				const found = this.checkedDepartments.find((dep) => dep.id === department.id);
				if (!found) {
					this.checkedDepartments.push(department);
				}
				this.addDepartmentMembers(department);
			} else {
				this.checkedDepartments = this.checkedDepartments.filter(
					(dep) => dep.id !== department.id
				);
				this.removeDepartmentMembersRecursively(department);
			}
			// 체크/해제 후, 현재 체크된 부서 목록 콘솔 출력
			console.log('현재 체크된 부서 ID 목록:', this.checkedDepartments);
		},
		async addDepartmentMembers(department) {

			try {
				const response = await api.get('user/adminsList', {
					params: {
						page: this.currentPage,
						size: this.pageSize, // 혹은 필요한 만큼
						departmentId: department.id,
					},
				});
				const fetchedMembers = response.data.content.map(member => ({
					id: member.id,
					account: member.account,
					name: member.name,
					status: member.status,
					positionId: member.positionId,
					positionName: member.positionName || 'N/A',
					departmentId: member.departmentId,
					departmentName: member.departmentName,
					email: member.email,
					phoneNumber: member.phoneNumber || 'N/A',
					storedFileName: member.profileImg
				}));

				// 이미 members에 다른 부서의 멤버가 있을 수 있으므로 합쳐서 중복만 제거
				// 'id' 기준으로 중복 체크
				const combined = [...this.members, ...fetchedMembers];
				// id를 기준으로 중복 제거
				this.members = combined.filter((m, index, self) =>
					index === self.findIndex((x) => x.id === m.id)
				);
			} catch (error) {
				console.error('Error fetching members:', error);
			}
		},

		removeDepartmentMembers(department) {
			// this.members 배열에서 departmentId === department.id 인 것만 필터링하여 제거
			this.members = this.members.filter(m => m.departmentId !== department.id);
		},
		search() {
			this.currentPage = 1;
			this.fetchMembers();
		},
		async deleteSelected() {
			await api.post('user/delete', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				ids: this.selectedMembers
			});
			this.selectedMembers = [];
			this.fetchMembers();
			alert(`삭제되었습니다.`);
		},

		async approveMembers() {
			if (this.selectedMembers.length === 0) {
				alert('가입 승인할 사용자를 선택해주세요.')
			}

			try {
				const memberIds = this.selectedMembers.map(member => member.id);
				console.log(memberIds);
				await api.post('user/approve', {
					ids: memberIds,
				});
				alert('선택된 멤버들이 승인되었습니다.');
				this.fetchMembers();
				this.selectedMembers = [];
			} catch (error) {
				console.error('Error approving members:', error);
				alert('멤버 승인 중 문제가 발생했습니다.');
			}
		},
		async updateSelected() {
			try {
				await api.post('user/update', {
					memberIds: this.selectedMembers,
					updates: { /* 업데이트할 데이터 추가 */ },
				});
				alert('멤버 업데이트 중 문제가 발생했습니다.');
				this.fetchMembers();
				this.selectedMembers = [];
			} catch (error) {
				console.error('Error updating members:', error);
				alert('멤버 업데이트 중 문제가 발생했습니다.');
			}
		},
		async removeDepartment(departmentId) {
			try {
				await api.post('department/delete', null, {
					params: { departmentId }, // params로 쿼리 스트링 전달
				});
				this.fetchDepartments();
				alert('부서가 삭제되었습니다.');
			} catch (error) {
				console.error('Error removing department:', error);
				alert('부서를 삭제하는 도중 문제가 발생했습니다.');
			}
		},
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			this.fetchMembers();
		},
		previewImage(event) {
			const file = event.target.files[0];
			if (file) {
				this.profileImageUrl = URL.createObjectURL(file);
			}
		},
	},
};
</script>

<style>
.scrollable-content>>>.modal-body {
	overflow-x: auto;
	white-space: nowrap;
	max-width: 100%;
}

.active>.page-link,
.page-link.active {
	z-index: 3;
	color: #212529;
	background-color: #e9ecef;
	border-color: #f5f5f5;
}
</style>