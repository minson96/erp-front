<template>
	<div class="container-fluid mt-4">
		<div class="modal fade" id="addCompanyModal" tabindex="-1" aria-labelledby="addCompanyModalLabel" aria-hidden="true"
			ref="modal">
			<div class="modal-dialog">
				<div class="modal-content">
					<!-- <div class="modal-header">
						<h5 class="modal-title" id="addCompanyModalLabel">회사 추가</h5>
						<button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
					</div>-->
					<div class="modal-body">
						<form @submit.prevent="addCompany">
							<div>
								<div
									class="border rounded-circle overflow-hidden d-flex align-items-center justify-content-center mx-auto mb-3"
									style="width: 100px; height: 100px;">
									<img v-if="logoImageUrl" :src="logoImageUrl" alt="Profile Preview"
										class="w-100 h-100 object-fit-cover" />
									<i v-else class="bi bi-building" style="font-size: 3rem;"></i>
								</div>
								<div class="d-flex justify-content-center align-items-center mt-3 mb-2">
									<label for="logoImage" class="btn btn-secondary" style="cursor: pointer;">
										사진 변경
									</label>
									<input id="logoImage" ref="logoImage" type="file" accept=".jpg, .jpeg, .png" @change="previewImage"
										style="display: none;" />
								</div>
							</div>
							<div class="d-flex justify-content-center align-items-center mb-2">
								<label for="companyName" class="form-label me-2">회사명</label>
								<input v-model="newCompany.name" type="text" id="companyName" class="form-control"
									placeholder="회사명을 입력하시오." style="width: 75%;" required />
							</div>
							<div class="d-flex justify-content-center align-items-center mb-2">
								<label for="companyAddress" class="form-label me-2">회사 주소</label>
								<input v-model="newCompany.address" type="text" id="companyAddress" class="form-control"
									placeholder="회사 주소를 입력하세요." style="width: 75%;" required />
							</div>
							<button class="btn btn-secondary" type="submit">추가</button>
						</form>
					</div>
				</div>
			</div>
		</div>

		<div v-if="companies.length" class="mt-4">
			<!-- <h4>Company List</h4> -->
			<table class="table table-bordered">
				<thead>
					<tr>
						<th>#</th>
						<th>회사명</th>
						<th>회사 주소</th>
						<th>관리자</th>
						<th>변경</th>
						<th>삭제</th>
					</tr>
				</thead>
				<tbody class="">
					<tr v-for="(company, index) in companies" :key="company.id">
						<td>{{ index + 1 }}</td>
						<td>{{ company.name }}</td>
						<td>{{ company.address }}</td>
						<td>
							<!-- 검색창 추가 하고 userList 확인 -->
							<select id="user" v-model="selectedUsers[company.id]" class="form-select me-3"
								style="width: 100%; max-height: 200px; overflow-y: auto;" @focus="findUser(company.id)">
								<option value="">관리자</option>
								<option v-for="user in usersByCompany[company.id] || []" :key="user.id" :value="user.id">
									{{ user.name }} ({{ user.account }})
								</option>
							</select>

						</td>
						<td>
							<button class="btn btn-secondary btn-sm" @click="assignAdmin(selectedUsers[company.id], company.id)">
								변경
							</button>
						</td>
						<td>
							<button class="btn btn-secondary btn-sm" @click="deleteCompany(company.id)">삭제</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div v-else>
			<p>회사를 생성해주세요.</p>
		</div>
		<button class="btn btn-secondary" @click="openModal">회사 추가</button>
	</div>
</template>

<script>
import api from "@/axios";
import { Modal } from 'bootstrap';
import { reactive } from 'vue';

export default {
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	async mounted() {
		await this.fetchCompanies();
		await this.initializeUsers();
	},
	data() {
		return {
			companies: [],
			newCompany: {
				name: "",
				address: "",
				logoImg: null,
			},
			logoImageUrl: null,
			modalInstance: null,
			users: [],
			user: null,
			companyId: null,
			usersByCompany: {}, // 회사 ID별 사용자 리스트
			selectedUsers: {}, // 회사 ID별 선택된 사용자
		};
	},

	methods: {
		async findUser(companyId) {
			try {
				// API 호출로 특정 회사의 사용자 리스트를 가져옴
				const response = await api.get('/user/search', { params: { companyId } });
				const filteredUsers = response.data.filter(user => user.role === "ADMIN" || user.role === "USER");
				this.usersByCompany[companyId] = filteredUsers;

				const adminUser = response.data.find(user => user.role === "ADMIN");
				this.selectedUsers[companyId] = adminUser ? adminUser.id : "";
				console.log(this.selectedUsers[companyId])
			} catch (error) {
				console.error(`Error fetching users for company ID ${companyId}:`, error);
			}
		},
		async initializeUsers() {
			// 모든 회사에 대해 사용자 리스트 초기화
			for (const company of this.companies) {
				await this.findUser(company.id); // 각 회사의 ID로 findUser 호출
			}
		},
		openModal() {
			// 모달 초기화 및 열기
			const modalElement = this.$refs.modal;
			this.modalInstance = new Modal(modalElement);
			this.modalInstance.show();
		},
		closeModal() {
			// 모달 닫기
			if (this.modalInstance) {
				this.modalInstance.hide();
			}
		},
		async fetchCompanies() {
			try {
				const response = await api.get("/company/list", {
					params: {
						searchTerm: ""
					}
				});
				this.companies = response.data;
			} catch (error) {
				console.error("Error fetching companies:", error);
			}
		},
		async addCompany() {
			try {
				const formData = new FormData();
				formData.append("name", this.newCompany.name);
				formData.append("address", this.newCompany.address);
				if (this.$refs.logoImage.files[0]) {
					formData.append("logoImg", this.$refs.logoImage.files[0]);
				} // 파일 추가

				await api.post("/company/create", formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});

				this.newCompany = {
					name: "",
					address: "",
					logoImg: null,
				}; // Reset input
				this.logoImageUrl = null;
				this.$refs.logoImage.value = "";
				// 모달 닫기
				this.closeModal();
				this.fetchCompanies(); // Refresh company list
			} catch (error) {
				console.error("Error adding company:", error);
			}
		},
		async deleteCompany(companyId) {
			try {
				await api.post('/company/delete', null, {
					params: {
						companyId: companyId,
					}
				});
				this.fetchCompanies(); // Refresh company list
			} catch (error) {
				console.error("Error deleting company:", error);
				alert('이용 중인 사용자가 있습니다.')
			}
		},
		async assignAdmin(userId, companyId) {
			console.log(userId)
			try {
				await api.post(`/company/assign-admin`, null, { params: { userId, companyId } });
				alert("Admin role assigned successfully.");
			} catch (error) {
				console.error("Error assigning admin role:", error);
			}
		},
		previewImage(event) {
			const file = event.target.files[0];
			if (file) {
				this.logoImageUrl = URL.createObjectURL(file);
			}
		},
	},
};
</script>

<style>
.container {
	max-width: 600px;
}

.modal-body img {
	max-width: 100%;
	height: auto;
}
</style>
