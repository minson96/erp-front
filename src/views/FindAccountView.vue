<template>
	<div class="container d-flex justify-content-center align-items-center vh-100">
		<div v-if="!isIdFound" class="card p-4 shadow-sm">
			<form>
				<div class="mb-3 d-flex align-items-center">
					<label for="name" class="form-label me-3" style="width: 47px;">이름</label>
					<input type="text" @input="nameValidate" id="name" title="이름은 최대 30자로 영어 대소문자, 한글을 포함해야 합니다." v-model="name"
						class="form-control" style="width: 60%;" placeholder="이름을 입력하세요">
				</div>
				<div v-if="errors.name" class="text-danger">{{ errors.name }}</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="email" class="form-label me-3" style="width: 47px;">메일</label>
					<input type="email" @input="emailValidate" id="email" v-model="email" style="width: 60%;" class="form-control"
						placeholder="메일을 입력하세요" title="이메일은 최대 50자로 영어 대소문자, 숫자, '.', '@'을 포함해야 합니다." required>
					<button :disabled="sendButton" @click="sendEmail" class="btn btn-primary">전송</button>
				</div>
				<div v-if="errors.email" class="text-danger mb-2">{{ errors.email }}</div>
				<div class="d-flex align-items-center">
					<label for="verificationCode" class="form-label me-3" style="width: 47px;">인증번호</label>
					<input type="text" id="verificationCode" v-model="verificationCode" style="width: 60%;" class="form-control"
						required @keyup.enter.prevent="verifyCode" placeholder=" 인증번호를 입력하세요">
					<button type="button" @click="verifyCode" class="btn btn-primary">확인</button>

				</div>
				<div v-if="errors.emailVerification" class="text mb-2">{{ errors.emailVerification }}</div>
				<button type="button" @click="findId" class="btn btn-primary">아이디 찾기</button>
			</form>
		</div>
		<div v-else class="card p-4 shadow-sm text-center">
			<p>귀하의 아이디는 {{ account }}입니다.</p>
			<div>
				<button @click="ToLoginPage" class="btn btn-primary" style="width: 34%;">로그인 페이지</button>
				<button @click="resetPassword" class="btn btn-primary" style="width: 39%;">비밀번호재설정</button>
			</div>
		</div>
	</div>
</template>

<script>
import api from '@/axios';

export default {
	data() {
		return {
			errors: [],
			sendButton: false,
			name: '',
			email: '',
			verificationCode: '',
			account: '',
			isIdFound: false,
			isVerified: false
		};
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
		async sendEmail() {
			try {
				this.sendButton = true;
				await api.post('/user/sendEmail', { email: this.email });
				console.log('Email verification sent to:', this.email);
				alert('메일함을 확인하세요')
				this.sendButton = false;
			} catch (error) {
				console.error('Error verifying email code:', error);
				this.errors.email = '이메일을 다시 확인해주세요.';
				this.sendButton = false;
			}
		},
		async verifyCode() {
			if (this.verificationCode) {
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
			}
		},
		async findId() {
			// 아이디 찾기 로직
			if (!this.name) {
				this.errors.name = '이름을 입력하세요.';
			}
			else if (!this.email) {
				this.errors.email = '이메일을 입력하세요.';
			}
			else if (this.isVerified === false) {
				this.errors.emailVerification = '인증번호가 일치하지 않습니다.';
			}
			try {
				if (this.name && this.email && this.verificationCode) {
					const response = await api.get('/user/findAccount', {
						params: {
							email: this.email,
							name: this.name
						}
					})
					if (response.data) {
						this.account = response.data;
						this.isIdFound = true;
					}


				}
			} catch {
				alert('입력하신 정보를 확인해주세요.')
			}
		},
		ToLoginPage() {
			this.$router.push({ name: 'login' })
		},
		resetPassword() {
			this.$router.push({ name: 'resetPassword' })
		}
	}
};
</script>

<style>
/* Bootstrap을 사용하므로 추가 스타일은 필요하지 않습니다 */
</style>
