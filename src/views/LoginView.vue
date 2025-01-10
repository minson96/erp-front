<template>
	<div class="container d-flex justify-content-center align-items-center vh-100">
		<div class="card p-4 shadow-sm">
			<!-- <img :src="`/upload/${companyLogoUrl}`" alt="Company Logo" class="card-img-top mx-auto d-block mb-3"
				style="max-width: 150px;" /> -->
			<h2 class="card-title text-center">Login</h2>
			<form @submit.prevent="handleLogin">
				<div class="mb-3 d-flex align-items-center">
					<label for="username" class="form-label me-3" style="width: 100px;">아이디</label>
					<input type="text" id="username" v-model="username" class="form-control" required />
				</div>
				<div class="mb-3 d-flex align-items-center">
					<label for="password" class="form-label me-3" style="width: 100px;">비밀번호</label>
					<input type="password" id="password" v-model="password" class="form-control" required />
				</div>
				<button type="submit" class="btn btn-primary w-100">로그인</button>
			</form>

			<div class="text-center mt-3">
				<a href="#" @click.prevent="register" class="text-decoration-none">회원가입</a> |
				<a href="#" @click.prevent="findUsername" class="text-decoration-none">아이디 찾기</a> |
				<a href="#" @click.prevent="resetPassword" class="text-decoration-none">비밀번호 재설정</a>
			</div>
		</div>
	</div>
</template>

<script>
import api from '@/axios';

export default {
	emits: ['login-user', 'login-success'],
	data() {
		return {
			username: '',
			password: '',
			companyLogoUrl: '',
			loginUserProfile: {
				id: null,
				account: "",
				departmentId: null,
				email: "",
				name: "",
				originalFileName: "",
				password: "",
				positionId: null,
				role: "",
				status: "",
				storedFileName: "",
				companyId: "",
			},
		};
	},

	created() {
		this.fetchCompanyLogoUrl();

		const token = localStorage.getItem('token');
		if (token) {
			this.$router.push({ name: 'home' });
		}
	},
	methods: {
		async fetchCompanyLogoUrl() {
			try {
				const response = await api.get('/company/logo');
				this.companyLogoUrl = response.data;
			} catch (error) {
				console.error('Error fetching logo URL:', error);
				return './assets/default-logo.png';
			}
		},

		async handleLogin() {
			try {
				const response = await api.post('/user/login', {
					account: this.username,
					password: this.password
				});
				const token = response.headers['access-token'];
				const refreshToken = response.headers['refresh-token']
				const tokenExpiry = response.headers['access-token-exp']
				const refreshTokenExpiry = response.headers['refresh-token-exp']
				if (token) {
					const jwt = token.replace('Bearer ', '');
					localStorage.setItem('token', jwt);
					localStorage.setItem('refreshToken', refreshToken)
					localStorage.setItem('tokenExpiry', tokenExpiry)
					localStorage.setItem('refreshTokenExpiry', refreshTokenExpiry)
					api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
					this.$emit('login-success', token);
					const response1 = await api.get('/user/myInfo', {
						headers: {
							Authorization: `Bearer ${token}`
						}
					});
					this.loginUserProfile = response1.data;

					this.$emit('login-user', this.loginUserProfile);
					console.log("!!!!!!!!")
					console.log(this.loginUserProfile)
					this.$router.replace({ name: 'home' });
				} else {
					alert('Login failed. Please check your credentials.');
				}
			} catch (error) {
				console.error('Error logging in:', error.message);
				alert('입력하신 정보를 다시 확인해 주시기 바랍니다.');
			}
		},
		// async fetchUserProfile(token) {
		// 	try {

		// 	} catch (error) {
		// 		console.error('Failed to fetch user profile:', error);
		// 	}
		// },
		findUsername() {
			this.$router.push({ name: 'findAccount' });
			console.log('Finding username');
		},
		resetPassword() {
			this.$router.push({ name: 'resetPassword' });
			console.log('Resetting password');
		},
		register() {
			this.$router.push({ name: 'signup' });
			console.log('Registering new user');
		}
	}
};
</script>

<style scoped>
.container {
	height: 100vh;
}

.card {
	max-width: 500px;
	width: 100%;
}

.card-img-top {
	max-width: 150px;
}
</style>
