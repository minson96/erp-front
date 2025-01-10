<template>
	<table class="table table-bordered">
		<thead>
			<tr>
				<th>부서명</th>
				<!-- <th>상위 부서 ID</th> -->
				<!-- <th>삭제</th> -->
				<th>부서장</th>
				<th>변경</th>
			</tr>
		</thead>
		<tbody>
			<!-- 부서 목록을 순회하여 테이블 형태로 표시 -->
			<tr v-for="(dept, idx) in flattenedDepartments" :key="dept.id">

				<td>{{ dept.name }}</td>
				<!-- 예: 상위 부서 정보가 parentId 형태로 있다고 가정 -->
				<!-- <td>{{ dept.parentId ? dept.parentId : '최상위 부서' }}</td> -->
				<!-- <td>
					<button class="btn btn-danger btn-sm" @click="onRemoveDepartment(dept.id)">
						삭제
					</button>
				</td> -->
				<td>
					<!-- 부서에 있는 사람 리스트 가져와서 지정 -->

					<select id="user" v-model="selectedUsers[dept.id]" class="form-select me-3"
						style="width: 100%; max-height: 200px; overflow-y: auto;" @focus="findUser(dept.id)">
						<option value="">부서장</option>
						<option v-for="user in usersByDepart[dept.id] || []" :key="user.id" :value="user.id">
							{{ user.name }} ({{ user.account }})
						</option>
					</select>

				</td>
				<td>
					<button class="btn btn-secondary btn-sm" @click="assignAdmin(selectedUsers[dept.id], dept.id)">
						변경
					</button>
				</td>
			</tr>
		</tbody>
	</table>
</template>

<script>
import api from "@/axios";

export default {
	name: 'DepartmentList',
	props: {
		// 트리 구조 전체를 받아올 수 있도록 설정
		departments: {
			type: Array,
			required: true,
		},
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			usersByDepart: {}, // 회사 ID별 사용자 리스트
			selectedUsers: {}, // 회사 ID별 선택된 사용자
		}
	},
	computed: {
		/**
		 * departments가 트리 구조(중첩 subDepartments)를 가진다면
		 * 이를 평탄화(Flatten)해서 1차원 배열로 만드는 예시입니다.
		 */
		flattenedDepartments() {
			const result = [];
			const traverse = (dept) => {
				if (dept.parentId !== null) {
					result.push(dept);
				}
				if (dept.subDepartments && dept.subDepartments.length) {
					dept.subDepartments.forEach(sub => traverse(sub));
				}
			};
			this.departments.forEach(d => traverse(d));
			return result;
		},
	},
	async mounted() {
		// await this.fetchDepartments();
		await this.initializeUsers();
	},
	methods: {
		assignAdmin(userId, departmentId) {
			if (!userId) {
				alert('부서장을 선택해주세요.');
				return;
			}
			// 부서장 지정 API 호출
			api.post('/department/assign-hod', null, { params: { userId } })
				.then(() => {
					alert('부서장이 성공적으로 지정되었습니다.');
					this.findUser(departmentId); // 업데이트된 사용자 목록을 다시 가져옴
				})
				.catch(error => {
					console.error('Error assigning admin:', error);
					alert('부서장 지정에 실패했습니다.');
				});
		},
		// async fetchDepartments() {
		// 	try {
		// 		const response = await api.get("/department/list", {
		// 			params: {
		// 				companyId: this.userProfile.companyId,
		// 			}
		// 		});
		// 		this.departments = response.data;
		// 	} catch (error) {
		// 		console.error("Error fetching companies:", error);
		// 	}
		// },
		async initializeUsers() {
			// 모든 회사에 대해 사용자 리스트 초기화
			for (const dept of this.departments) {
				await this.findUser(dept.id); // 각 회사의 ID로 findUser 호출
			}
		},
		async findUser(departmentId) {
			try {
				// API 호출로 특정 회사의 사용자 리스트를 가져옴
				const response = await api.get('/user/departinsearch', { params: { departmentId } });

				// "HOD" 또는 "USER"인 사용자만 필터링
				const filteredUsers = response.data.filter(user => user.role === "HOD" || user.role === "USER");
				this.usersByDepart[departmentId] = filteredUsers;

				// 필터링된 사용자 중에서 "HOD" 역할인 사용자를 찾음
				const adminUser = filteredUsers.find(user => user.role === "HOD");
				this.selectedUsers[departmentId] = adminUser ? adminUser.id : "";

				console.log(this.selectedUsers[departmentId]);
			} catch (error) {
				console.error(`Error fetching users for company ID ${departmentId}:`, error);
			}
		},
		onRemoveDepartment(departmentId) {
			// 상위(CompanyView.vue)에서 removeDepartment를 쓰고 있으니
			// 이벤트를 상위로 emit합니다.
			this.$emit('remove-department', departmentId);
		},
	},
};
</script>