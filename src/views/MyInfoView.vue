<template>
	<div class="container">
		<div class="row">
			<div class="col-md-3 text-center">
				<!-- 프로필 이미지 및 업로드 -->
				<div class="border rounded-circle overflow-hidden d-flex align-items-center justify-content-center mx-auto mb-3"
					style="width: 100px; height: 100px;">
					<img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile Preview"
						class="w-100 h-100 object-fit-cover" />
					<img v-else-if="userProfile.storedFileName" :src="`/upload/${userProfile.storedFileName}`"
						alt="Profile Preview" class="w-100 h-100 object-fit-cover" />
					<!-- <span v-else class="d-inline-block w-100 h-100 text-center text-muted" style="line-height: 100px;">사진</span> -->
					<i v-else class="bi bi-person" style="font-size: 3rem;"></i>
				</div>
				<div class="d-flex justify-content-center align-items-center mt-3">
					<!-- label에 for 속성을 통해 input의 id를 연결해줍니다. -->
					<label for="profileImage" class="btn btn-secondary" style="cursor: pointer;">
						사진 변경
					</label>

					<!-- 실제 파일 input은 화면에서 보이지 않게 숨깁니다. -->
					<input id="profileImage" ref="profileImage" type="file" accept=".jpg, .jpeg, .png" @change="previewImage"
						style="display: none;" />
				</div>
			</div>

			<div class="col-md-9">
				<div class="row mb-3">
					<label class="col-3 fw-bold">아이디</label>
					<div class="col-9">{{ userProfile.account }}</div>
				</div>
				<div class="row mb-3">
					<label class="col-3 fw-bold">이름</label>
					<div class="col-9">{{ userProfile.name }}</div>
				</div>
				<div class="row mb-3">
					<label class="col-3 fw-bold">비밀번호</label>
					<div class="col-9">
						<button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#passwordResetModal">비밀번호
							재설정</button>
					</div>
				</div>
				<div class="row mb-3">
					<label class="col-3 fw-bold">메일</label>
					<div class="col-9">
						<input type="email" class="form-control" v-model="userProfile.email" @input="emailValidate"
							title="이메일은 최대 50자로 영어 대소문자, 숫자, '.', '@'을 포함해야 합니다." />
					</div>
				</div>
				<div class="row mb-3">
					<label class="col-3 fw-bold">부서</label>
					<div class="col-9">
						<select v-model="department" class="form-select">
							<option value="">부서</option>
							<option v-for="dept in subDepartments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
						</select>
					</div>
				</div>
				<div class="row mb-3">
					<label class="col-3 fw-bold">직위</label>
					<div class="col-9">
						<select v-model="position" class="form-select">
							<option value="">직위</option>
							<option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.title }}</option>
						</select>
					</div>
				</div>
				<div class="row mb-4">
					<label class="col-3 fw-bold">회사전화번호</label>
					<div class="col-9">
						<input type="tel" class="form-control" v-model="userProfile.companyNumber" @input="companyNumberValidate"
							title="최대 20자로 숫자와 '-'만 입력할 수 있습니다." />
					</div>
				</div>
				<div class="row mb-4">
					<label class="col-3 fw-bold">휴대전화번호</label>
					<div class="col-9">
						<input type="tel" class="form-control" v-model="userProfile.phoneNumber" @input="phoneNumberValidate"
							title="최대 20자로 숫자와 '-'만 입력할 수 있습니다." />
					</div>
				</div>
			</div>

			<div class="text-end">
				<button class="btn btn-secondary me-2" @click="deleteProfile">탈퇴하기</button>
				<button class="btn btn-secondary" @click="updateProfile">개인 정보 수정</button>
			</div>
		</div>
	</div>


	<!-- Password Reset Modal -->
	<div class="modal fade" id="passwordResetModal" tabindex="-1" aria-labelledby="passwordResetModalLabel"
		aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="passwordResetModalLabel">비밀번호 재설정</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="mb-3">
						<label for="newPassword" class="form-label">비밀번호</label>
						<input type="password" class="form-control" id="newPassword" v-model="newPassword" @input="passwordValidate"
							title="비밀번호는 최대 30자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다." placeholder="비밀번호를 입력하세요" />
					</div>
					<div v-if="errors.password" class="text-danger mb-2">{{ errors.password }}</div>
					<div class="mb-3">
						<label for="confirmPassword" class="form-label">비밀번호 확인</label>
						<input type="password" class="form-control" id="confirmPassword" v-model="confirmPassword"
							title="비밀번호는 최대 30자로 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다." placeholder="비밀번호 확인을 입력하세요" />
					</div>
					<div v-if="passwordError" class="text-danger">
						{{ passwordError }}
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
					<button type="button" class="btn btn-primary" @click="resetPassword">확인</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import api from '@/axios';
import { Modal } from 'bootstrap';
export default {
	name: 'MyInfoView',
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			errors: {},
			newPassword: '',
			confirmPassword: '',
			passwordError: '',
			profileImageUrl: '',
			position: '',
			positions: [],
			department: '',
			subDepartments: [],

		};
	},
	created() {
		console.log(this.userProfile)
		this.profileImageUrl = ''
		this.fetchDepartments2();
		this.fetchJobPostions();
		this.position = this.userProfile.positionId;
		this.department = this.userProfile.departmentId;
	},
	methods: {
		passwordValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9!@#$%^&*()]*$/;

			if (!regex.test(this.newPassword)) {
				this.errors.password = '영문 대소문자와 숫자, !@#$%^&*()만 입력 가능합니다.';
			} else {
				this.errors.password = '';
			}

			// 최대 길이 제한
			if (this.newPassword.length > 30) {
				this.newPassword = this.newPassword.slice(0, 30);
				this.errors.password = '최대 30자까지만 입력 가능합니다.';
			}
		},
		phoneNumberValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[0-9\-]*$/;

			if (!regex.test(this.userProfile.phoneNumber)) {
				this.errors.phoneNumber = '숫자와 "-"만 입력 가능합니다.';
			} else {
				this.errors.phoneNumber = '';
			}

			// 최대 길이 제한
			if (this.userProfile.phoneNumber.length > 20) {
				this.userProfile.phoneNumber = this.userProfile.phoneNumber.slice(0, 20);
				this.errors.phoneNumber = '최대 20자까지만 입력 가능합니다.';
			}
		},
		emailValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[A-Za-z0-9@.]*$/;

			if (!regex.test(this.userProfile.email)) {
				this.errors.email = '영문과 숫자, ".", "@"만 입력 가능합니다.';
			} else {
				this.errors.email = '';
			}

			// 최대 길이 제한
			if (this.userProfile.email.length > 50) {
				this.userProfile.email = this.userProfile.email.slice(0, 50);
				this.errors.email = '최대 50자까지만 입력 가능합니다.';
			}
		},
		companyNumberValidate() {
			// 정규식: 한글, 영문 대소문자, 숫자, @와 .만 허용
			const regex = /^[0-9\-]*$/;

			if (!regex.test(this.userProfile.companyNumber)) {
				this.errors.companyNumber = '숫자와 "-"만 입력 가능합니다.';
			} else {
				this.errors.companyNumber = '';
			}

			// 최대 길이 제한
			if (this.userProfile.companyNumber.length > 20) {
				this.userProfile.companyNumber = this.userProfile.companyNumber.slice(0, 20);
				this.errors.companyNumber = '최대 20자까지만 입력 가능합니다.';
			}
		},
		async resetPassword() {
			if (!this.newPassword) this.errors.password = '비밀번호를 입력하세요.';
			if (this.newPassword !== this.confirmPassword)
				this.errors.confirmPassword = '비밀번호가 일치하지 않습니다.';

			await api.post('/user/password-reset', {
				email: this.userProfile.email,
				newPassword: this.confirmPassword
			})
			// Add API call here to reset password
			this.passwordError = '';
			alert('비밀번호가 성공적으로 재설정되었습니다.');
			this.newPassword = '';
			this.confirmPassword = '';
			const modalElement = document.getElementById('passwordResetModal');
			const modal = Modal.getInstance(modalElement);
			modal.hide();
		},
		async updateProfile() {
			const formData = new FormData();
			formData.append('id', this.userProfile.id);
			formData.append('departmentId', this.department);
			formData.append('account', this.userProfile.account);
			formData.append('positionId', this.position);
			formData.append('email', this.userProfile.email);
			if (this.$refs.profileImage && this.$refs.profileImage.files[0]) {
				formData.append('profileImg', this.$refs.profileImage.files[0]);
			}
			formData.append('phoneNumber', this.userProfile.phoneNumber);
			formData.append('companyNumber', this.userProfile.companyNumber);
			try {
				const response = await api.post('/user/update', formData, {
					headers: { 'Content-Type': 'multipart/form-data' },
				});
				alert('개인 정보가 수정되었습니다.');
				this.$router.push({ name: 'home' })
			} catch (error) {
				console.error('Error updating profile:', error);
			}
		},
		async deleteProfile() {
			const response = await api.post('/user/delete', {
				headers: {
					Authorization: `${localStorage.getItem('token')}`
				},
				ids: [this.userProfile.id]
			})
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('tokenExpiry');
			localStorage.removeItem('refreshTokenExpiry');
			this.token = null;
			this.fetchUserProfile();
			window.location.href = 'http://localhost:3000/login';
		},
		async fetchUserProfile() {
			try {
				const response = await api.get('/user/profile');
				this.userProfile = response.data;
				console.log("?????")
				console.log(this.userProfile)
			} catch (error) {
				console.error('Failed to fetch user profile:', error);
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
		async fetchDepartments2() {
			try {
				const response = await api.get('/department/list', {
					params: { companyId: this.userProfile.companyId }
				});

				console.log(response)
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
		previewImage(event) {
			const file = event.target.files[0];
			if (file) {
				this.profileImageUrl = URL.createObjectURL(file);
			}
		},
	}
};
</script>

<style scoped>
.card {
	border: 1px solid #ddd;
}

.profile-container {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.photo-placeholder {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	border: 1px solid #000;
	display: flex;
	justify-content: center;
	align-items: center;
}

img.photo-placeholder {
	object-fit: cover;
}

.info-section {
	flex: 1;
}

.additional-info {
	margin-top: 20px;
}

/* .row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
} */

.form-label {
	width: 100px;
	text-align: right;
}

.button-group {
	margin-top: 20px;
}
</style>
