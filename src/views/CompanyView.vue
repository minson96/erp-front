<template>
	<div class="container mt-4">
		<!-- <h2>Department and Position Management</h2> -->

		<!-- Department and Position List -->
		<div class="row mt-4">
			<div class="col-md-8">
				<div class="container">
					<!-- (중략) 다른 코드들... -->

					<!-- 트리 구조가 아니라, 새로 만든 DepartmentList로 표시 -->
					<DepartmentList :departments="departments" @remove-department="removeDepartment"
						:user-profile="userProfile" />
				</div>

			</div>
			<div class="col-md-4">
				<!-- <h4>Positions</h4> -->
				<table class="table table-bordered">
					<thead>
						<tr>
							<!-- <th>#</th> -->
							<th>직위</th>
							<th>삭제</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(position, index) in positions" :key="position.id">
							<!-- <td>{{ index + 1 }}</td> -->
							<td>{{ position.title }}</td>
							<td>
								<button class="btn btn-secondary btn-sm" @click="deletePosition(position.id)">삭제</button>
							</td>
						</tr>
					</tbody>
				</table>
				<button class="btn btn-secondary" @click="openPositionModal">직위 추가</button>
			</div>
		</div>

		<!-- Modals -->


		<!-- Add Position Modal -->
		<div class="modal fade" id="positionModal" tabindex="-1" ref="positionModal">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">직위 추가</h5>
						<button type="button" class="btn-secondary" @click="closePositionModal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<input v-model="newPosition.title" type="text" class="form-control" placeholder="추가할 직위명을 입력하세요." />
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary me-2" @click="addPosition">추가</button>
						<button type="button" class="btn btn-secondary" @click="closePositionModal">취소</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Appoint Head Modal -->
		<div class="modal fade" id="appointModal" tabindex="-1" ref="appointModal">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Appoint Department Head</h5>
						<button type="button" class="btn-secondary" @click="closeAppointModal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<select v-model="selectedUserId" class="form-select">
							<option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
						</select>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" @click="closeAppointModal">Close</button>
						<button type="button" class="btn btn-secondary" @click="appointHead">Appoint</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import DepartmentItem from './DepartmentItem.vue';
import DepartmentList from './DepartmentList.vue';

import { Modal } from "bootstrap";
import api from "@/axios";
import { reactive } from 'vue';

export default {
	components: { DepartmentItem, DepartmentList, },
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	created() {
		this.fetchDepartments();
	},
	data() {
		return {

			positions: [],
			users: [],
			newPosition: { title: "" },
			selectedUserId: null,
			selectedDepartment: [],
			subDepartments: [],
			checkedDepartments: [],

			positionModal: null,
			appointModal: null,
			departments: reactive([]),
			// members: [],
			companyId: null,
		};
	},
	created() {
		this.fetchDepartments();

	},
	methods: {
		// async addDepartmentMembers(department) {

		// 	try {
		// 		const response = await api.get('user/adminsList', {
		// 			params: {
		// 				page: 1,
		// 				size: 9999, // 혹은 필요한 만큼
		// 				departmentId: department.id,
		// 			},
		// 		});
		// 		const fetchedMembers = response.data.content.map(member => ({
		// 			id: member.id,
		// 			account: member.account,
		// 			name: member.name,
		// 			status: member.status,
		// 			positionId: member.positionId,
		// 			positionName: member.positionName || 'N/A',
		// 			departmentId: member.departmentId,
		// 			departmentName: member.departmentName,
		// 			email: member.email,
		// 			phoneNumber: member.phoneNumber || 'N/A',
		// 			storedFileName: member.profileImg
		// 		}));

		// 		// 이미 members에 다른 부서의 멤버가 있을 수 있으므로 합쳐서 중복만 제거
		// 		// 'id' 기준으로 중복 체크
		// 		const combined = [...this.members, ...fetchedMembers];
		// 		// id를 기준으로 중복 제거
		// 		this.members = combined.filter((m, index, self) =>
		// 			index === self.findIndex((x) => x.id === m.id)
		// 		);
		// 	} catch (error) {
		// 		console.error('Error fetching members:', error);
		// 	}
		// },
		// removeDepartmentMembers(department) {
		// 	// this.members 배열에서 departmentId === department.id 인 것만 필터링하여 제거
		// 	this.members = this.members.filter(m => m.departmentId !== department.id);
		// },
		toggleExpandCollapse(department, expanded) {
			department.expanded = expanded;
			if (department.subDepartments && department.subDepartments.length) {
				department.subDepartments.forEach(subDept => {
					this.toggleExpandCollapse(subDept, expanded);
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
		async fetchDepartments() {
			try {
				const response = await api.get('department/list', {
					params: { companyId: this.userProfile.companyId },
				});
				if (response.data && response.data.length > 0) {
					this.companyId = response.data[0].companyId; // 첫 번째 department에서 companyId 추출
				}
				this.departments = this.processDepartments(response.data);
				console.log(this.departments)
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
				department.subDepartments.push(newDept);
				department.newSubDepartmentName = '';
				this.fetchDepartments();

			} catch (error) {
				console.error('Error adding sub-department:', error);
			}
		},
		handleToggleDepartment(department) {

			const index = this.selectedDepartment.findIndex((dept) => dept.id === department.id);
			if (index === -1) {
				this.selectedDepartment.push(department); // 추가
			} else {
				this.selectedDepartment.splice(index, 1); // 제거
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
		fetchPositions() {
			api.get('/position/list', {
				params: {
					companyId: this.userProfile.companyId
				}
			}).then((response) => {
				this.positions = response.data;
			});
		},
		fetchUsers() {
			api.get("/user/list").then((response) => {
				this.users = response.data;
			});
		},


		openPositionModal() {
			this.positionModal = new Modal(this.$refs.positionModal);
			this.positionModal.show();
		},
		closePositionModal() {
			if (this.positionModal) this.positionModal.hide();
		},
		openAppointModal(departmentId) {
			this.selectedDepartmentId = departmentId;
			this.appointModal = new Modal(this.$refs.appointModal);
			this.fetchUsers();
			this.appointModal.show();
		},
		closeAppointModal() {
			if (this.appointModal) this.appointModal.hide();
		},
		addPosition() {
			console.log(this.companyId)
			api.post("/position/create", null, {
				params: {
					companyId: this.companyId,
					title: this.newPosition.title
				}
			}).then(() => {
				this.fetchPositions();
				this.newPosition.name = "";
				this.closePositionModal();
			});
		},
		async deletePosition(positionId) {
			try {
				await api.post("/position/delete", null, {
					params: {
						companyId: this.companyId,
						positionId: positionId,
					},
				});

				// 직위 삭제 성공 시, 목록을 다시 가져옵니다.
				await this.fetchPositions();
			} catch (error) {
				// 401 에러 또는 기타 에러 처리
				if (error.response && error.response.status === 401) {
					alert('현재 직위를 가진 사용자가 있습니다!');
				} else {
					console.error('An error occurred while deleting the position:', error);
					alert('직위 삭제 중 문제가 발생했습니다.');
				}
			}
		},
		appointHead() {
			api.post("/department/appoint", {
				departmentId: this.selectedDepartmentId,
				userId: this.selectedUserId,
			}).then(() => {
				this.closeAppointModal();
			});
		},
	},
	mounted() {
		this.fetchPositions();
	},
};
</script>

<style>
.modal-body input,
.modal-body select {
	width: 100%;
}
</style>