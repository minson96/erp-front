import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
const routes = [
	{
		path: '/login',
		name: 'login',
		component: LoginView
	},
	// {
	// 	path: '/signup',
	// 	name: 'signup',
	// 	component: SignUpView
	// }
  {
    path: '/signup',
    name: 'signup',
    component: () => import(/* webpackChunkName: "signup" */ '../views/SignUpView.vue')
	},
	{
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '../views/HomeView.vue')
	},
	{
    path: '/findAccount',
    name: 'findAccount',
    component: () => import(/* webpackChunkName: "findAccount" */ '../views/FindAccountView.vue')
	},
	{
		path: '/resetPassword',
		name: 'resetPassword',
		    component: () => import(/* webpackChunkName: "resetPassword" */ '../views/ResetPasswordView.vue')
	},
	{
		path: '/board',
		name: 'board',
		    component: () => import(/* webpackChunkName: "board" */ '../views/BoardListView.vue')
	},
	{
		path: '/company',
		name: 'company',
		    component: () => import(/* webpackChunkName: "company" */ '../views/CompanyView.vue')
	},
	{
		path: '/management',
		name: 'management',
		    component: () => import(/* webpackChunkName: "management" */ '../views/ManagementView.vue')
	},
	{
		path: '/attendance',
		name: 'attendance',
		    component: () => import(/* webpackChunkName: "attendance" */ '../views/AttendanceView.vue')
	},
	{
		path: '/organization',
		name: 'organization',
		    component: () => import(/* webpackChunkName: "organization" */ '../views/OrganizationView.vue')
	},
	{
		path: '/loginhistory',
		name: 'loginhistory',
		    component: () => import(/* webpackChunkName: "loginhistory" */ '../views/LoginHistoryView.vue')
	},
	{
		path: '/myinfo',
		name: 'myinfo',
		    component: () => import(/* webpackChunkName: "myinfo" */ '../views/MyInfoView.vue')
	},
	{
		path: '/schedule',
		name: 'schedule',
		    component: () => import(/* webpackChunkName: "myinfo" */ '../views/ScheduleView.vue')
	},
	{
		path: '/postmessage',
		name: 'postmessage',
		    component: () => import(/* webpackChunkName: "postmessage" */ '../views/PostMessageView.vue')
	},
	{
		path: '/vote',
		name: 'vote',
		    component: () => import(/* webpackChunkName: "vote" */ '../views/VoteView.vue')
	}
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
