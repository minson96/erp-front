<template>
	<div class="container mt-4">
		<table class="table table-bordered text-center">
			<thead>
				<tr>
					<th>IP</th>
					<th>브라우저</th>
					<th>OS</th>
					<th>시간</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(item, index) in items" :key="index">
					<td>{{ item.ip }}</td>
					<td>{{ item.userAgent }}</td>
					<td>{{ item.os }}</td>
					<td>{{ item.loginTime }}</td>
				</tr>
			</tbody>
		</table>
		<div class="d-flex justify-content-center mb-4">
			<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요" class="form-control w-25 me-2" />
			<button @click="fetchLoginList" class="btn btn-secondary">검색</button>
		</div>
		<nav v-if="totalPages > 0" aria-label="Page navigation" class="d-flex justify-content-center mt-4">
			<ul class="pagination">
				<!-- 첫 페이지 -->
				<li class="page-item" :class="{ disabled: currentPage === 1 }">
					<a class="page-link" href="#" aria-label="First" @click.prevent="goToPage(1)">
						<span aria-hidden="true">&laquo;&laquo;</span>
					</a>
				</li>

				<!-- 이전 페이지 -->
				<li class="page-item" :class="{ disabled: currentPage === 1 }">
					<a class="page-link" href="#" aria-label="Previous" @click.prevent="goToPage(currentPage - 1)">
						<span aria-hidden="true">&laquo;</span>
					</a>
				</li>

				<!-- 페이지 번호 목록 (동적 계산) -->
				<li class="page-item" v-for="page in pageNumbers" :key="page" :class="{ active: page === currentPage }">
					<a class="page-link" href="#" @click.prevent="goToPage(page)">
						{{ page }}
					</a>
				</li>

				<!-- 다음 페이지 -->
				<li class="page-item" :class="{ disabled: currentPage === totalPages }">
					<a class="page-link" href="#" aria-label="Next" @click.prevent="goToPage(currentPage + 1)">
						<span aria-hidden="true">&raquo;</span>
					</a>
				</li>

				<!-- 마지막 페이지 -->
				<li class="page-item" :class="{ disabled: currentPage === totalPages }">
					<a class="page-link" href="#" aria-label="Last" @click.prevent="goToPage(totalPages)">
						<span aria-hidden="true">&raquo;&raquo;</span>
					</a>
				</li>
			</ul>
		</nav>
	</div>
</template>
<script>
import api from '@/axios';
export default {
	data() {
		return {
			items: [],
			totalPages: 10,
			currentPage: 1,
			pageSize: 10,
			searchQuery: ''
		};
	},
	created() {
		this.fetchLoginList();
	},
	computed: {
		pageNumbers() {
			// 전체 페이지 수가 10 이하라면 전체를 그냥 보여줌
			if (this.totalPages <= 10) {
				return Array.from({ length: this.totalPages }, (_, i) => i + 1);
			}

			// 10 페이지 초과할 때, 현재 페이지를 기준으로 슬라이딩 처리
			const maxVisible = 10;
			let startPage = this.currentPage - 4; // 현재 페이지 -4
			let endPage = this.currentPage + 5;   // 현재 페이지 +5

			// 만약 startPage가 1보다 작아지면 1로 고정
			if (startPage < 1) {
				startPage = 1;
				endPage = 10; // 1~10
			}
			// endPage가 totalPages보다 크면 totalPages로 고정
			if (endPage > this.totalPages) {
				endPage = this.totalPages;
				startPage = this.totalPages - maxVisible + 1; // totalPages - 9
				if (startPage < 1) startPage = 1;
			}

			// startPage부터 endPage까지 배열 생성
			const pages = [];
			for (let p = startPage; p <= endPage; p++) {
				pages.push(p);
			}
			return pages;
		},
	},
	methods: {
		async fetchLoginList() {
			try {
				const response = await api.get(`/user/loginList?page=${this.currentPage}&size=${this.pageSize}`, {
					params: {
						search: this.searchQuery
					}
				});
				this.items = response.data.content;
				this.totalPages = response.data.totalPages;
			} catch (error) {
				console.error('Error fetching login list:', error);
			}
		},
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			this.fetchLoginList();
		}
	}
};
</script>
<style scoped>
.container {
	max-width: 900px;
}

.table {
	margin-bottom: 20px;
}

.pagination {
	margin-top: 20px;
}

.pagination .page-item {
	display: inline-block;
}

.pagination .page-link {
	cursor: pointer;
}

.active>.page-link,
.page-link.active {
	z-index: 3;
	color: #212529;
	background-color: #e9ecef;
	border-color: #f5f5f5;
}
</style>
