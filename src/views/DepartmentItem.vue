<template>
	<li>
		<div class="d-flex align-items-center mb-1">
			<!-- 부서 펼치기/접기 토글 버튼 -->
			<button @click="toggleDepartment(department)"
				class="btn btn-outline-secondary btn-sm me-2 d-flex align-items-center justify-content-center"
				style="width: 1.3rem; height: 1.3rem;"
				:disabled="!department.subDepartments || department.subDepartments.length === 0">
				<!-- 펼쳐져 있으면 아래 화살표, 아니면 오른쪽 화살표 -->
				<i v-if="department.expanded" class="bi bi-chevron-down" style="font-size: 0.9rem;"></i>
				<i v-else class="bi bi-chevron-right" style="font-size: 0.9rem;"></i>
			</button>

			<!-- 체크박스와 라벨 -->
			<div class="form-check me-2">
				<input v-if="showCheckbox" type="checkbox" :id="'department-' + department.id"
					@change="handleDepartmentSelection(department, $event)" class="form-check-input"
					:checked="department.checked" />
				<label class="form-check-label" :for="'department-' + department.id" style="cursor: pointer;">
					{{ department.name }}
				</label>
			</div>

			<!-- 관리자 권한일 때만 아이콘 버튼 노출 -->
			<div v-if="userProfile && userProfile.role === 'ADMIN'" class="d-flex align-items-center justify-content-center">
				<!-- 하위 부서 추가 [+] 아이콘 대신, bi-plus 사용 -->
				<button class="btn btn-outline-primary btn-sm me-1 d-flex align-items-center justify-content-center"
					style="width: 1.3rem; height: 1.3rem;" @click="toggleAddInput(department)">
					<i class="bi bi-plus" style="font-size: 0.9rem;"></i>
				</button>

				<!-- 부서 삭제 [-] 아이콘 대신, bi-dash 사용 -->
				<button class="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
					style="width: 1.3rem; height: 1.3rem;" @click="removeDepartment(department.id)">
					<i class="bi bi-dash" style="font-size: 0.9rem;"></i>
				</button>
			</div>
		</div>

		<!-- 하위 부서 추가 입력창 -->
		<div v-if="department.showAddInput" class="mb-2 ms-4">
			<div class="input-group" style="max-width: 300px;">
				<input type="text" v-model="department.newSubDepartmentName" placeholder="하위 부서 이름 입력" class="form-control" />
				<button class="btn btn-success btn-sm" @click="addSubDepartment(department)">
					추가
				</button>
			</div>
		</div>

		<!-- 하위 부서가 있을 경우 재귀적으로 표시 -->
		<ul v-if="department.expanded && department.subDepartments.length" class="ms-4 list-unstyled">
			<DepartmentItem v-for="subDept in department.subDepartments" :key="subDept.id" :department="subDept"
				:user-profile="userProfile" @fetch-members="fetchMembersFromSub"
				@toggle-department="$emit('toggle-department', subDept)" @add-sub-department="addSubDepartment"
				@remove-department="removeDepartment" :members="members" :show-checkbox="showCheckbox" />
		</ul>
	</li>
</template>

<script>
export default {
	props: {
		department: Object,
		userProfile: Object,
		members: {
			type: Array,
			required: true, // 필수로 설정
		},
		showCheckbox: {
			type: Boolean,
			default: true, // 기본적으로 체크박스를 표시
		},
	},
	mounted() {
		// 컴포넌트가 마운트된 후, department에 대해서 모두 체크
		if (this.department) {
			this.setAllChecked(this.department);
		}
	},
	emits: ['fetch-members', 'toggle-department', 'add-sub-department', 'remove-department'],
	methods: {
		setAllChecked(dept) {
			dept.checked = true;
			if (Array.isArray(dept.subDepartments)) {
				dept.subDepartments.forEach(sub => {
					this.setAllChecked(sub);
				});
			}
		},
		toggleDepartment(department) {
			console.log(`Toggling department: ${department.name}, Expanded: ${!department.expanded}`);

			department.expanded = !department.expanded;
			this.$emit('toggle-department', department);
		},
		handleDepartmentSelection(department, event) {
			const isChecked = event.target.checked;
			department.checked = isChecked;
			this.checkSubDepartments(department, isChecked);
			this.checkDepartmentMembers(department.id, isChecked); // 부서 사용자의 체크 상태 변경
			this.$emit('fetch-members', { department, isChecked }); // 멤버 데이터를 요청
		},
		checkDepartmentMembers(departmentId, isChecked) {
			if (!this.members || !Array.isArray(this.members)) {
				console.warn('members 배열이 정의되지 않았습니다.');
				return;
			}
			// members 배열에서 해당 부서 ID와 매칭되는 사용자를 체크
			const departmentMembers = this.members.filter(member => member.departmentId === departmentId);
			departmentMembers.forEach(member => {
				member.checked = isChecked; // 사용자의 체크 상태 변경
			});
		},
		checkSubDepartments(department, isChecked) {
			// Vue 3는 직접 할당으로 반응성을 유지
			department.checked = isChecked;
			if (Array.isArray(department.subDepartments)) {
				department.subDepartments.forEach(subDept => {
					this.checkSubDepartments(subDept, isChecked);
				});
			}
		},
		toggleAddInput(department) {
			department.showAddInput = !department.showAddInput;
		},
		addSubDepartment(department) {
			this.$emit('add-sub-department', department);
		},
		removeDepartment(departmentId) {
			this.$emit('remove-department', departmentId);
		},
		fetchMembersFromSub(subDept) {
			this.$emit('fetch-members', subDept);
		},
	},
};

</script>
<style scoped>
.form-check {
	padding-left: 1.5rem;
	/* 원하는 값으로 변경 */
}
</style>