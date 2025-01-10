<template lang="">
    <div class="container d-flex justify-content-center align-items-center vh-100">
        <img v-if="companyLogoUrl" :src="`/upload/${companyLogoUrl}`" alt="Company Logo"
				style="max-width: 150px;" />
    </div>
</template>

<script>
import api from '@/axios';

export default {
	props: {
		userProfile: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			companyLogoUrl: '',
		}
	},
	created() {
		this.checkToken();

		const token = localStorage.getItem('token');
		if (token) {
			this.$emit('token-changed', token);
			this.fetchCompanyLogoUrl();
		} else {
			this.$router.push({ name: 'login' });
		}
	},
	methods: {
		async fetchCompanyLogoUrl() {
			try {
				const response = await api.get('/company/logo', {
					params: {
						companyId: this.userProfile.companyId
					}
				});
				this.companyLogoUrl = response.data;
			} catch (error) {
				console.error('Error fetching logo URL:', error);
				return './assets/default-logo.png';
			}
		},
		checkToken() {
			this.token = localStorage.getItem('token');
		},
	}
}
</script>

<style lang="">
</style>
