<template>
	<div class="container d-flex justify-content-center align-items-center vh-100">
		<div class="card p-4 shadow-sm w-100" style="max-width: 700px;">
			<h2 class="card-title text-center">회원가입</h2>
			<form @submit.prevent="handleRegister">
				<div class="mb-3 d-flex align-items-center">
					<label for="profileImage" class="form-label me-3" style="width: 65px;">프로필 사진</label>
					<input type="file" id="profileImage" ref="profileImage" accept=".jpg, .jpeg, .png" @change="previewImage"
						class="form-control me-3" style="width: 80%;" />
					<img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile Preview" class="img-thumbnail"
						style="max-width: 100px; max-height: 100px;" />

				</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="company" class="form-label me-3" style="width: 80px;">회사</label>
					<input type="text" id="company" v-model="company" class="form-control" style="width: 70%;"
						placeholder="회사명을 검색하세요" @keyup.enter="handleCompanySearch" required />
					<button type="button" class="btn btn-secondary ms-3" @click="handleCompanySearch">검색</button>
				</div>
				<div v-if="errors.company" class="text-danger">{{ errors.company }}</div>

				<div class="mb-3 d-flex">
					<label for="department" class="form-label me-3" style="width: 80px;">부서</label>
					<select id="department" v-model="department" class="form-select me-3"
						style="width: 30%; max-height: 200px; overflow-y: auto;">
						<option value="">부서</option>
						<option v-for="dept in subDepartments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
					</select>
					<label for="position" class="form-label me-3" style="width: 80px;">직위</label>
					<select id="position" v-model="position" class="form-select me-3" style="width: 30%">
						<option value="">직위</option>
						<option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.title }}</option>
						<!-- 직위 옵션 추가 -->
					</select>
				</div>
				<div v-if="errors.department" class="text-danger">{{ errors.department }}</div>
				<div v-if="errors.position" class="text-danger">{{ errors.position }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="name" class="form-label me-3" style="width: 80px;">이름</label>
					<input @input="nameValidate" type="text" id="name" v-model="name" class="form-control" style="width: 80%;"
						placeholder="이름을 입력하시오." title="이름은 최대 30자로 영어 대소문자, 한글을 포함해야 합니다." required />
				</div>
				<div v-if="errors.name" class="text-danger">{{ errors.name }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="account" class="form-label me-3" style="width: 80px;">아이디</label>
					<input @input="accountValidate" id="account" v-model="account" class="form-control" style="width: 80%;"
						placeholder="아이디를 입력하세요" title="아이디는 최대 50자로 영어 대소문자, 숫자를 포함해야 합니다." required />
				</div>
				<div v-if="errors.account" class="text-danger mb-2">{{ errors.account }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="password" class="form-label me-3" style="width: 80px;">비밀번호</label>
					<input id="password" v-model="password" class="form-control" style="width: 80%;" @input="passwordValidate"
						placeholder="비밀번호를 입력하세요" title="비밀번호는 최대 30자로 영어 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
						required />
				</div>
				<div v-if="errors.password" class="text-danger mb-2">{{ errors.password }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="confirmPassword" class="form-label me-3" style="width: 80px;">비밀번호 확인</label>
					<input type="password" id="confirmPassword" v-model="confirmPassword" class="form-control"
						@input="confirmPasswordValidate" style="width: 80%;" placeholder="비밀번호를 한 번 더 입력하세요"
						title="비밀번호와 동일하게 입력합니다." required />
				</div>
				<div v-if="errors.confirmPassword" class="text-danger mb-2">{{ errors.confirmPassword }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="email" class="form-label me-3" style="width: 80px;">메일</label>
					<input @input="emailValidate" id="email" v-model="email" class="form-control me-3" style="width: 70%;"
						placeholder="메일을 입력하세요" title="이메일은 최대 50자로 영어 대소문자, 숫자, '.', '@'을 포함해야 합니다." required
						@keyup.enter="sendEmailVerification" />
					<button :disabled="sendButton" class="btn btn-secondary" @click="sendEmailVerification">전송</button>
				</div>
				<div v-if="errors.email" class="text-danger mb-2">{{ errors.email }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="verificationCode" class="form-label me-3" style="width: 80px;">인증번호</label>
					<input type="text" id="verificationCode" v-model="verificationCode" class="form-control me-3"
						style="width: 70%;" placeholder="인증번호를 입력하세요" required @keyup.enter="verifyEmailCode" />
					<button type="button" class="btn btn-secondary" @click="verifyEmailCode">확인</button>
				</div>
				<div v-if="errors.emailVerification" class="text mb-2">{{ errors.emailVerification }}</div>
				<button type="submit" class="btn btn-primary w-100">가입 신청</button>
			</form>
		</div>

		<!-- Company Search Modal -->
		<div class="modal fade" id="companySearchModal" tabindex="-1" aria-labelledby="companySearchModalLabel"
			aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="companySearchModalLabel">회사 검색</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="d-flex align-items-center justify-content-center">
							<input type="text" class="form-control mb-3" placeholder="회사명을 검색하세요" required
								@keyup.enter="handleInsideCompanySearch" v-model="company" style="width:80%" />
							<button type="button" class="btn btn-secondary ms-3" @click="handleInsideCompanySearch">검색</button>
						</div>
						<table class="table">
							<thead>
								<tr>
									<th>회사명</th>
									<th>회사 주소</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(company, index) in companies" :key="company.id" @click="selectCompany(company)">
									<td>{{ company.name }}</td>
									<td>{{ company.address }}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { Modal } from 'bootstrap';
import api from '@/axios';

export default {
	data() {
		return {
			sendButton: false,
			errors: {},
			company: '',
			companyId: null,
			department: '',
			positions: [],
			position: '',
			name: '',
			account: '',
			password: '',
			confirmPassword: '',
			email: '',
			verificationCode: '',
			searchQuery: '',
			companies: [],
			departments: [],
			subDepartments: [],
			isVerified: false,
			profileImageUrl: '',
		};
	},
	created() {
		this.fetchCompanies();
	},
	methods: {
		nameValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[가-힣A-Za-z]*$/;

			if (!regex.test(this.name)) {
				this.errors.name = '한글, 영문만 입력 가능합니다.';
			} else if (this.name.length > 30) {
				this.name = this.name.slice(0, 30);
				this.errors.name = '최대 30자까지만 입력 가능합니다.';
			} else {
				this.errors.name = '';
			}
		},
		async emailValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9@.]*$/;

			if (!regex.test(this.email)) {
				this.errors.email = '영문과 숫자, ".", "@"만 입력 가능합니다.';
			} else if (this.email.length > 50) {
				this.email = this.email.slice(0, 50);
				this.errors.email = '최대 50자까지만 입력 가능합니다.';
			} else {
				this.errors.email = '';
			}
		},
		passwordValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9!@#$%^&*()]*$/;

			if (!regex.test(this.password)) {
				this.errors.password = '영문 대소문자와 숫자, !@#$%^&*()만 입력 가능합니다.';
			} else if (this.password.length > 30) {
				this.password = this.password.slice(0, 30);
				this.errors.password = '최대 30자까지만 입력 가능합니다.';
			} else {
				this.errors.password = '';
			}
		},

		confirmPasswordValidate() {

			if (this.password !== this.confirmPassword) {
				this.errors.confirmPassword = '비밀번호와 일치하지 않습니다.';
			} else {
				this.errors.confirmPassword = '';
			}
		},

		accountValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9]*$/;

			if (!regex.test(this.account)) {
				this.errors.account = '영문 대소문자와 숫자만 입력 가능합니다.';
			} else if (this.account.length > 50) {
				this.account = this.account.slice(0, 50);
				this.errors.account = '최대 50자까지만 입력 가능합니다.';
			} else {
				this.errors.account = '';
			}
		},
		handleCompanySearch() {
			this.errors.company = '';
			this.searchQuery = this.company;
			this.fetchCompanies();
			this.openCompanySearch();
		},
		handleInsideCompanySearch() {
			this.searchQuery = this.company;
			this.fetchCompanies();
		},
		openCompanySearch() {
			const modal = new Modal(document.getElementById('companySearchModal'));
			modal.show();
		},
		async fetchCompanies() {
			try {
				const response = await api.get('/company/list', {
					params: {
						searchTerm: this.searchQuery
					}
				});
				this.companies = response.data;
			} catch (error) {
				console.error('Error fetching companies:', error);
			}
		},
		selectCompany(company) {
			this.company = company.name;
			this.companyId = company.id;
			this.fetchDepartments(Number(company.id));
			this.fetchJobPostions(Number(company.id));
			const modal = Modal.getInstance(document.getElementById('companySearchModal'));
			if (modal) {
				modal.hide();
			}
		},
		async fetchDepartments(companyId) {
			try {
				const response = await api.get('/department/list', {
					params: { companyId: Number(companyId) }
				});

				if (response && response.data) {
					// 전체 부서 리스트에서 하위 부서가 비어있는 부서들만 필터링
					this.subDepartments = this.getEmptySubDepartments(response.data);
				}
			} catch (error) {
				console.error('Failed to fetch departments:', error);
			}
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
		async fetchJobPostions(companyId) {
			try {
				const response = await api.get('/position/list', {
					params: { companyId: Number(companyId) }
				});
				this.positions = response.data;
			} catch (error) {
				console.error('Error fetching departments:', error);
			}
		},
		async sendEmailVerification() {
			try {
				this.sendButton = true;
				await api.post('/user/sendEmail', { email: this.email });
				console.log('Email verification sent to:', this.email);
				alert('메일함을 확인하세요')
				this.sendButton = false;
				this.errors.email = '';
			} catch (error) {
				this.errors.email = '이메일을 확인해주세요';
				this.sendButton = false;
			}
		},
		async verifyEmailCode() {
			try {
				const response = await api.post('/user/verifyEmail', {
					email: this.email,
					verificationCode: this.verificationCode
				});
				if (response.data.verified) {
					this.isVerified = true;
					console.log('Email verified successfully:', response.data.message);
					this.errors.emailVerification = '인증되었습니다.'
				} else {
					console.error('Verification failed', response.data.message);
					this.errors.emailVerification = '인증번호가 일치하지 않습니다.'
				}
			} catch (error) {
				console.error('Error verifying email code:', error);
			}
		},
		async handleRegister() {
			// Validation Logic
			if (!this.company) {
				this.errors.company = '회사를 입력하세요.'
			}
			else if (!this.name) this.errors.name = '이름을 입력하세요.';
			else if (!this.account) this.errors.account = '아이디를 입력하세요.';
			else if (!this.password) this.errors.password = '비밀번호를 입력하세요.';
			else if (this.password !== this.confirmPassword)
				this.errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
			else if (!this.email) this.errors.email = '이메일을 입력하세요.';
			else if (!this.isVerified)
				this.errors.emailVerification = '인증번호가 일치하지 않습니다.';

			try {
				const formData = new FormData();
				formData.append('companyId', this.companyId);
				formData.append('departmentId', this.department);
				formData.append('positionId', this.position);
				formData.append('name', this.name);
				formData.append('account', this.account);
				formData.append('password', this.confirmPassword);
				formData.append('email', this.email);
				if (this.$refs.profileImage.files[0]) {
					formData.append('profileImg', this.$refs.profileImage.files[0]);
				}
				const response = await api.post('/user/create', formData, {
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				})
				console.log('User created:', response.data);
				alert('가입 신청이 완료되었습니다. 가입 승인이 되면 메일이 전송됩니다. 이후에 로그인 부탁드립니다.')
				this.$router.push({ name: 'login' });
			} catch (error) {
				console.error('Error creating user:', error);
			}
			// Handle register logic here
			console.log('Registering with:', this.company, this.department, this.position, this.name, this.account, this.password, this.confirmPassword, this.email, this.verificationCode);
		},
		previewImage(event) {
			const file = event.target.files[0];
			if (file) {
				this.profileImageUrl = URL.createObjectURL(file);
			}
		}
	}
};
</script>

<style scoped>
.container {
	height: 100vh;
}

.card {
	max-width: 600px;
	width: 100%;
}

.form-label {
	text-align: right;
}
</style>
