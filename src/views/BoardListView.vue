<template>
	<div class="container mt-4">
		<table class="table table-bordered text-center">
			<thead>
				<tr>
					<th v-if="userProfile && userProfile.role === 'ADMIN'">선택</th>
					<th>게시판명</th>
					<th>제목</th>
					<th>날짜</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(item, index) in boardItems" :key="index">
					<td v-if="userProfile && userProfile.role === 'ADMIN'">
						<input type="checkbox" v-model="selectedItems" :value="item.id" />
					</td>
					<td>{{ item.boardName }}</td>
					<td>
						<a href="#" class="text-decoration-none" @click.prevent="openModal(item.id)">{{ item.title }}</a>
					</td>
					<td>{{ formatDate(item.createdAt) }}</td>
				</tr>
			</tbody>
		</table>
		<div class="d-flex justify-content-center align-items-center">
			<input type="text" v-model="searchQuery" placeholder="검색어를 입력하세요" class="form-control w-25 me-2" />
			<button @click="search" class="btn btn-secondary">검색</button>
			<div v-if="userProfile && userProfile.role === 'ADMIN'">
				<button class="btn btn-secondary ms-2" @click="confirmDelete">삭제</button>
				<button class="btn btn-secondary ms-2" data-bs-toggle="modal" data-bs-target="#registerModal">등록</button>
				<button class="btn btn-secondary ms-2" @click="openBoardManagementModal">게시판 관리</button>
			</div>
		</div>
		<div class="d-flex justify-content-center align-items-center mt-3">
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

		<!-- Modal -->
		<div class="modal fade" id="detailModal" tabindex="-1" aria-labelledby="detailModalLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="detailModalLabel">게시물 상세</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<p><strong>제목</strong> {{ modalData.title }}</p>
						<p><strong>게시판명</strong> {{ modalData.boardName }}</p>
						<p><strong>내용</strong> {{ modalData.content }}</p>
						<div class="d-flex border p-3">
							<ul class="flex-grow-1 mb-0">
								<li v-for="fileName in parseFileNames(modalData.storedFileNames)" :key="fileName">
									<a :href="generateFileUrl(fileName)" download>{{ fileName }}</a>
								</li>
							</ul>
							<button v-if="userProfile && userProfile.role === 'ADMIN'" class="btn btn-secondary"
								@click="updatePostModalOpen(); fetchPostDetails(modalData.id);">수정</button>
							<button type="button" class="btn btn-secondary align-self-start ms-3"
								data-bs-dismiss="modal">뒤로가기</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Confirm Delete Modal -->
		<div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel"
			aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="confirmDeleteModalLabel">삭제 확인</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<p>선택한 항목을 삭제하시겠습니까?</p>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
						<button type="button" class="btn btn-secondary" @click="deletePosts" data-bs-dismiss="modal">삭제</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Register Modal -->
		<div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="registerModalLabel">게시물 등록</h5>
						<!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
					</div>
					<div class="modal-body">
						<form @submit.prevent="registerPost">
							<div class="mb-3">
								<label for="title" class="form-label">제목</label>
								<input type="text" class="form-control" id="title" v-model="newPost.title" required />
							</div>
							<div class="mb-3">
								<label for="board" class="form-label">게시판</label>
								<select class="form-select" id="board" v-model="newPost.boardId" required>
									<option v-for="board in boards" :key="board.id" :value="board.id">{{ board.name }}</option>
								</select>
							</div>
							<div class="mb-3">
								<label for="content" class="form-label">내용</label>
								<textarea class="form-control" id="content" rows="4" v-model="newPost.content" required></textarea>
							</div>
							<div class="mb-3">
								<label for="file" class="form-label">파일 첨부</label>
								<input type="file" class="form-control" id="file" multiple @change="handleFileUpload" />
							</div>
							<button type="submit" class="btn btn-secondary">등록</button>
						</form>
					</div>
				</div>
			</div>
		</div>

		<!-- Update Modal -->
		<div class="modal fade" id="updateModal" tabindex="-1" aria-labelledby="updateModalLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="updateModalLabel">게시물 수정</h5>
					</div>
					<div class="modal-body">
						<form @submit.prevent="updatePost">
							<div class="mb-3">
								<label for="title" class="form-label">제목</label>
								<input type="text" class="form-control" id="title" v-model="editPost.title" required />
							</div>
							<div class="mb-3">
								<label for="board" class="form-label">게시판</label>
								<select class="form-select" id="board" v-model="editPost.boardId" required>
									<option v-for="board in boards" :key="board.id" :value="board.id">{{ board.name }}</option>
								</select>
							</div>
							<div class="mb-3">
								<label for="content" class="form-label">내용</label>
								<textarea class="form-control" id="content" rows="4" v-model="editPost.content" required></textarea>
							</div>
							<div class="mb-3">
								<label for="file" class="form-label">파일 첨부</label>
								<input type="file" class="form-control" id="file" multiple @change="handleFileUpload" />
							</div>
							<button type="submit" class="btn btn-secondary">수정</button>
						</form>
					</div>
				</div>
			</div>
		</div>

		<!-- Board Management Modal -->
		<div class="modal fade" id="boardManagementModal" tabindex="-1" aria-labelledby="boardManagementModalLabel"
			aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="boardManagementModalLabel">게시판 관리</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<table class="table table-bordered text-center">
							<thead>
								<tr>
									<th>선택</th>
									<th>게시판명</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="board in boards" :key="board.id">
									<td><input type="checkbox" v-model="selectedBoards" :value="board.id" /></td>
									<td>{{ board.name }}</td>
								</tr>
							</tbody>
						</table>
						<div class="d-flex justify-content-center">
							<input type="text" v-model="newBoardName" placeholder="게시판 이름 입력" class="form-control w-50 me-2" />
							<button class="btn btn-secondary me-2" @click="createBoard">추가</button>
							<button class="btn btn-secondary me-2" @click="deleteBoards">삭제</button>
							<button class="btn btn-secondary ">수정</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import api from '@/axios';
import { Modal } from 'bootstrap';

export default {
	props: {
		userProfile: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			editPost: {
				id: null,
				title: '',
				boardId: null,
				content: '',
				files: []
			},
			boardItems: [],
			searchQuery: '',
			totalPages: 10,
			currentPage: 1,
			pageSize: 10,
			modalData: {
				id: null,
				title: '',
				boardName: '',
				content: '',
				storedFileNames: '',
				fileUrl: ''
			},
			selectedItems: [], // 선택된 게시물 ID 리스트
			boards: [], // 게시판 목록
			newPost: {
				title: '',
				boardId: null,
				content: '',
				files: [],
			},
			selectedBoards: [], // 게시판 관리 선택 리스트
			newBoardName: '' // 새로운 게시판 이름
		};
	},
	created() {
		this.search();
		this.fetchBoards();
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
		updatePostModalOpen() {
			const modal = new Modal(document.getElementById('updateModal'));
			modal.show();
		},
		async updatePost() {
			const formData = new FormData();
			formData.append('id', this.editPost.id);
			formData.append('title', this.editPost.title);
			formData.append('boardId', this.editPost.boardId);
			formData.append('content', this.editPost.content);

			// 파일 추가

			this.editPost.files.forEach((file) => {
				formData.append('files', file);
			});


			try {
				await api.post('/post/update', formData, {

					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'multipart/form-data'
					}
				});
				alert('게시물이 성공적으로 수정되었습니다.');
				const modal = Modal.getInstance(document.getElementById('updateModal'));
				if (modal) {
					modal.hide();
				}
			} catch (error) {
				console.error('Error updating post:', error);
				alert('게시물 수정에 실패했습니다.');
			}
		},
		async fetchPostDetails(postId) {
			try {
				const response = await api.get(`/post/detail`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					},
					params: { postId: postId }
				});
				this.editPost = { ...response.data, files: [] }; // 서버 데이터로 editPost 설정
			} catch (error) {
				console.error('Error fetching post details:', error);
				alert('게시물 정보를 가져오는 데 실패했습니다.');
			}
		},
		async fetchBoards() {
			try {
				const response = await api.get('/board/list', {
					params: {
						companyId: this.userProfile.companyId
					}
				}); // 게시판 목록 API 호출
				this.boards = response.data;
			} catch (error) {
				console.error('Error fetching boards:', error);
			}
		},
		handleFileUpload(event) {
			this.newPost.files = Array.from(event.target.files); // 여러 파일 처리
		},
		async registerPost() {
			try {
				const formData = new FormData();
				formData.append('userId', this.userProfile.id);
				formData.append('title', this.newPost.title);
				formData.append('boardId', this.newPost.boardId);
				formData.append('content', this.newPost.content);
				this.newPost.files.forEach((file) => {
					formData.append('files', file); // 여러 파일 추가
				});

				await api.post('/post/create', formData, {
					headers: { 'Content-Type': 'multipart/form-data' },
				});
				alert('게시물이 등록되었습니다.');
				const modalElement = document.getElementById('registerModal');
				if (modalElement) {
					const modalInstance = Modal.getInstance(modalElement) || new Modal(modalElement);
					modalInstance.hide();
				}
				this.search();// 등록 후 게시물 목록 갱신

			} catch (error) {
				console.error('Error registering post:', error);
				alert('게시물 등록 중 오류가 발생했습니다.');
			}
		},
		async search() {
			try {
				const response = await api.get(`post/list?page=${this.currentPage}&size=${this.pageSize}`, {
					params: {
						companyId: this.userProfile.companyId,
						search: this.searchQuery
					}
				});
				this.boardItems = response.data.content;
				this.totalPages = response.data.totalPages;
			} catch (error) {
				console.error('Error fetching board items:', error);
			}
		},
		formatDate(dateString) {
			const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
			return new Date(dateString).toLocaleString('ko-KR', options);
		},
		goToPage(page) {
			if (page < 1) page = 1;
			if (page > this.totalPages) page = this.totalPages;
			this.currentPage = page;
			this.search();
		},
		async openModal(postId) {
			try {
				const response = await api.get('post/detail', {
					params: {
						postId: postId
					}
				});
				this.modalData = response.data;
				const modal = new Modal(document.getElementById('detailModal'));
				modal.show();
			} catch (error) {
				console.error('Error fetching post details:', error);
			}
		},
		parseFileNames(fileNames) {
			if (!fileNames) return [];
			return fileNames.split(',');
		},
		generateFileUrl(fileName) {
			const serverIp = '/upload';
			return `${serverIp}/${fileName}`;
		},
		confirmDelete() {
			const modal = new Modal(document.getElementById('confirmDeleteModal'));
			modal.show();
		},
		async deletePosts() {
			await api.post('post/delete', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				ids: this.selectedItems
			});
			this.search();
		},
		async deleteBoards() {
			if (this.selectedBoards.length === 0) {
				alert('삭제할 게시판을 선택하세요.');
				return;
			}
			try {
				await api.post('board/delete', {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					},
					ids: this.selectedBoards
				});
				alert('선택된 게시판이 삭제되었습니다.');
				this.fetchBoards(); // 삭제 후 목록 갱신
				this.selectedBoards = []; // 선택 초기화
			} catch (error) {
				console.error('Error deleting selected boards:', error);
				alert('삭제 중 오류가 발생했습니다.');
			}
		},
		async createBoard() {
			if (!this.newBoardName.trim()) {
				alert('게시판 이름을 입력하세요.');
				return;
			}
			try {
				await api.post('board/create', {
					name: this.newBoardName,
					companyId: this.userProfile.companyId
				});
				alert('새로운 게시판이 추가되었습니다.');
				this.fetchBoards(); // 추가 후 목록 갱신
				this.newBoardName = ''; // 입력 초기화
			} catch (error) {
				console.error('Error creating board:', error);
				alert('게시판 추가 중 오류가 발생했습니다.');
			}
		},
		openBoardManagementModal() {
			const modal = new Modal(document.getElementById('boardManagementModal'));
			modal.show();
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

.pagination .page-item {
	margin: 0 2px;
}

.active>.page-link,
.page-link.active {
	z-index: 3;
	color: #212529;
	background-color: #e9ecef;
	border-color: #f5f5f5;
}
</style>