<template>
	<div class="container d-flex justify-content-center align-items-center vh-100">
		<div v-if="boolIsVerified === false" class="card p-4 shadow-sm w-100" style="max-width: 500px;">
			<h4 class="text-center mb-4">비밀번호 재설정</h4>
			<form>
				<div class="mb-3 d-flex align-items-center">
					<label for="name" class="form-label me-3" style="width: 80px;">이름</label>
					<input type="text" @input="nameValidate" id="name" title="이름은 최대 30자로 영어 대소문자, 한글을 포함해야 합니다." v-model="name"
						class="form-control" style="width: 70%;" placeholder="이름을 입력하세요" required />
				</div>
				<div v-if="errors.name" class="text-danger">{{ errors.name }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="account" class="form-label me-3" style="width: 80px;">아이디</label>
					<input type="text" @input="accountValidate" title="아이디는 최대 50자로 영어 대소문자, 숫자를 포함해야 합니다." id="account"
						v-model="account" class="form-control" style="width: 70%;" placeholder="아이디를 입력하세요" required />
				</div>
				<div v-if="errors.account" class="text-danger mb-2">{{ errors.account }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="email" class="form-label me-3" style="width: 80px;">메일</label>
					<input type="email" @input="emailValidate" id="email" v-model="email"
						title="이메일은 최대 50자로 영어 대소문자, 숫자, '.', '@'을 포함해야 합니다." class="form-control me-3" style="width: 60%;"
						placeholder="메일을 입력하세요" required />
					<button type="button" :disabled="sendButton" class="btn btn-secondary" @click="sendEmailVerification">
						전송
					</button>
				</div>
				<div v-if="errors.email" class="text-danger mb-2">{{ errors.email }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="verificationCode" class="form-label me-3" style="width: 80px;">인증번호</label>
					<input type="text" id="verificationCode" v-model="verificationCode" class="form-control me-3"
						style="width: 60%;" placeholder="인증번호를 입력하세요" required />
					<button type="button" class="btn btn-secondary" @click="verifyEmailCode">
						확인
					</button>
				</div>
				<div v-if="errors.emailVerification" class="text mb-2">{{ errors.emailVerification }}</div>
				<div class="d-flex justify-content-end">
					<button type="button" @click="handleResetPassword" class="btn btn-primary">비밀번호 재설정</button>
				</div>
			</form>
		</div>
		<div v-else class="card p-4 shadow-sm w-100" style="max-width: 500px;">
			<form @submit.prevent="resetPassword">
				<div class="mb-3 d-flex align-items-center">
					<label for="password" class="form-label me-3" style="width: 80px;">비밀번호</label>
					<input type="password" title="비밀번호는 최대 30자로 영어 대소문자, 숫자, 특수문자(!,@,#,$,%,^,&,*,(,))를 포함해야 합니다."
						@input="passwordValidate" id="password" v-model="password" class="form-control" style="width: 70%;"
						placeholder="비밀번호를 입력하세요" required />
				</div>
				<div v-if="errors.password" class="text mb-2">{{ errors.password }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="repassword" class="form-label me-3" style="width: 80px;">비밀번호 확인</label>
					<input type="password" title="비밀번호와 동일하게 입력합니다." @input="confirmPasswordValidate" id="repassword"
						v-model="confirmPassword" class="form-control" style="width: 70%;" placeholder="비밀번호 확인을 입력하세요" required />
				</div>
				<div v-if="errors.confirmPassword" class="text mb-2">{{ errors.confirmPassword }}</div>
				<div class="d-flex justify-content-end">
					<button type="submit" class="btn btn-primary">비밀번호 재설정</button>
				</div>
			</form>
		</div>

	</div>
</template>

<script>
import api from '@/axios';

export default {
	data() {
		return {
			errors: {},
			sendButton: false,
			name: "",
			account: "",
			email: "",
			verificationCode: "",
			isVerified: false,
			password: "",
			confirmPassword: "",
			boolIsVerified: false
		};
	},
	methods: {
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
		async sendEmailVerification() {
			try {
				this.sendButton = true;
				await api.post('/user/sendEmail', { email: this.email });
				console.log('Email verification sent to:', this.email);
				alert('메일함을 확인하세요')
				this.sendButton = false;
			} catch (error) {
				this.errors.email = '이메일을 다시 확인해주세요.';
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
		async handleResetPassword() {
			try {
				if (this.name && this.account && this.email && this.isVerified) {
					const response = await api.get('/user/findUser', {
						params: {
							name: this.name,
							email: this.email,
							account: this.account
						}
					})
					console.log(response.data)

					this.boolIsVerified = true;

					return; // 필드가 하나라도 비어있다면 함수 종료
				}
			} catch {
				alert('입력한 정보를 확인해주세요.')
			}
		},
		async resetPassword() {
			if (!this.password) {
				this.errors.password = '비밀번호를 입력해주세요';
			} else if (!this.confirmPassword) {
				this.errors.confirmPassword = '비밀번호를 한 번 더 입력해주세요';
			}
			try {
				const response = await api.post('/user/password-reset', {
					email: this.email,
					name: this.name,
					newPassword: this.password
				});
				alert('비밀번호가 재설정되었습니다.')
				this.$router.push({ name: 'login' })
			} catch (error) {
				alert('입력하신 정보를 확인해주세요.')
			}

		}
	},
};
</script>

<style>
/* Additional custom styles if needed */
</style>
