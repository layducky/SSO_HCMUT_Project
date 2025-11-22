import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082';

class CASApp {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    async checkAuthStatus() {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/status`, {
                withCredentials: true
            });
            
            if (response.data.authenticated) {
                this.showAuthenticatedUI(response.data.user);
            } else {
                this.showLoginUI();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginUI();
        }
    }

    showLoginUI() {
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('user-info').textContent = '';
        document.getElementById('content').style.display = 'none';
        document.getElementById('login-form').style.display = 'none';
    }

    showAuthenticatedUI(user) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('user-info').textContent = `Welcome, ${user.username}!`;
        document.getElementById('content').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        
        document.getElementById('user-data').innerHTML = `
            <h3>User Information</h3>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>ID:</strong> ${user.id}</p>
        `;
    }

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', () => {
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('content').style.display = 'none';
        });

        document.getElementById('cancel-login').addEventListener('click', () => {
            document.getElementById('login-form').style.display = 'none';
            this.showLoginUI();
        });

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.handleLogout();
        });

        document.getElementById('fetch-data').addEventListener('click', async () => {
            await this.fetchProtectedData();
        });
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            console.log('Attempting login with:', credentials);
            
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
                withCredentials: true
            });

            console.log('Login response:', response.data);

            if (response.data.success) {
                document.getElementById('login-form').style.display = 'none';
                this.showAuthenticatedUI(response.data.user);
            } else {
                alert('Login failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check console for details.');
        }
    }

    async handleLogout() {
        try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
                withCredentials: true
            });
            this.showLoginUI();
            document.getElementById('api-response').textContent = '';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async fetchProtectedData() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/protected-data`, {
                withCredentials: true
            });
            
            document.getElementById('api-response').textContent = 
                JSON.stringify(response.data, null, 2);
        } catch (error) {
            console.error('Fetch error:', error);
            document.getElementById('api-response').textContent = 
                'Error fetching protected data. You may need to login again.';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CASApp();
});