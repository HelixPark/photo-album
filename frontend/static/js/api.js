// ===== API Client =====
const API_BASE = '';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  // Only redirect on 401 for non-auth endpoints (auth endpoints handle errors themselves)
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    removeToken();
    window.location.href = '/';
    return;
  }

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth
const Auth = {
  async register(username, email, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  async login(username, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  logout() {
    removeToken();
    window.location.href = '/';
  },

  isLoggedIn() {
    return !!getToken();
  },
};

// Albums
const Albums = {
  async list() {
    return apiFetch('/api/albums');
  },

  async create(title, description, isPublic) {
    return apiFetch('/api/albums', {
      method: 'POST',
      body: JSON.stringify({ title, description, is_public: isPublic }),
    });
  },

  async get(id) {
    return apiFetch(`/api/albums/${id}`);
  },

  async update(id, data) {
    return apiFetch(`/api/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id) {
    return apiFetch(`/api/albums/${id}`, { method: 'DELETE' });
  },

  async toggleShare(id) {
    return apiFetch(`/api/albums/${id}/share`, { method: 'POST' });
  },

  async getShared(token) {
    return apiFetch(`/api/albums/shared/${token}`);
  },
};

// Photos
const Photos = {
  async upload(albumId, files, onProgress) {
    const token = getToken();
    const formData = new FormData();
    formData.append('album_id', albumId);
    for (const file of files) {
      formData.append('files', file);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/photos/upload');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || '上传失败'));
          } catch {
            reject(new Error('上传失败'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(formData);
    });
  },

  async delete(id) {
    return apiFetch(`/api/photos/${id}`, { method: 'DELETE' });
  },

  imageUrl(id) {
    return `/api/photos/${id}/image`;
  },
};
