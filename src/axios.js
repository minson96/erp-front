import axios from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
	baseURL: 'api/v1',
	headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Axios 요청 인터셉터 설정
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry'); // 만료 시간 저장

    // 토큰 만료 시간 확인
    const currentTime = Date.now();
    if (token && tokenExpiry && currentTime >= tokenExpiry) {
      // 액세스 토큰이 만료된 경우 리프레시 토큰으로 새 토큰 발급 요청
      try {
        const response = await axios.post('/user/refresh', { refreshToken });
        token = response.data.accessToken;

        // 새 토큰과 만료 시간 저장
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiry', response.data.tokenExpiry);
      } catch (error) {
        console.error('토큰 갱신 실패:', error);
        // 리프레시 토큰 만료 시 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refreshTokenExpiry');
        window.location.href = '/login';
      }
    }

    // 액세스 토큰을 Authorization 헤더에 추가
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
