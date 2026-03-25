// ===== App State =====
let currentAlbum = null;
let selectedFiles = [];

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if this is a share page
  const path = window.location.pathname;
  const shareMatch = path.match(/^\/share\/([^/]+)/);

  if (shareMatch) {
    loadSharePage(shareMatch[1]);
    return;
  }

  if (Auth.isLoggedIn()) {
    showApp();
  } else {
    showAuthPage();
  }
});

// ===== Page Routing =====
function showAuthPage() {
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('share-page').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('share-page').style.display = 'none';

  const user = getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0].toUpperCase();
  }

  showAlbumList();
}

function showAlbumList() {
  document.getElementById('view-albums').style.display = 'block';
  document.getElementById('view-album-detail').style.display = 'none';
  currentAlbum = null;
  loadAlbums();
}

function showAlbumDetail(album) {
  currentAlbum = album;
  document.getElementById('view-albums').style.display = 'none';
  document.getElementById('view-album-detail').style.display = 'block';
  renderAlbumDetail(album);
}

// ===== Auth Handlers =====
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').classList.toggle('active', tab === 'login');
  document.getElementById('register-form').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const alert = document.getElementById('login-alert');
  const btn = document.getElementById('login-btn');

  alert.classList.remove('show');
  if (!username || !password) {
    alert.textContent = '请填写用户名和密码';
    alert.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 登录中...';

  try {
    await Auth.login(username, password);
    showApp();
  } catch (e) {
    alert.textContent = e.message;
    alert.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '登录';
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const alert = document.getElementById('register-alert');
  const btn = document.getElementById('register-btn');

  alert.classList.remove('show');
  if (!username || !email || !password) {
    alert.textContent = '请填写所有必填项';
    alert.classList.add('show');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert.textContent = '请输入有效的邮箱地址';
    alert.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 注册中...';

  try {
    await Auth.register(username, email, password);
    showApp();
  } catch (e) {
    alert.textContent = e.message;
    alert.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '注册';
  }
}

// Enter key support for auth forms
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  if (loginForm && loginForm.classList.contains('active')) handleLogin();
  else if (registerForm && registerForm.classList.contains('active')) handleRegister();
});

// ===== Albums =====
async function loadAlbums() {
  showLoading();
  try {
    const albums = await Albums.list();
    renderAlbumGrid(albums);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderAlbumGrid(albums) {
  const grid = document.getElementById('albums-grid');
  const empty = document.getElementById('albums-empty');
  const countText = document.getElementById('album-count-text');

  countText.textContent = `共 ${albums.length} 个相册`;

  if (albums.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = albums.map(album => `
    <div class="album-card" onclick="openAlbum(${album.id})">
      <div class="album-cover">
        ${album.cover_url
          ? `<img src="${album.cover_url}" alt="${escHtml(album.title)}" loading="lazy" onerror="this.parentElement.innerHTML='📷'">`
          : '📷'}
      </div>
      <div class="album-info">
        <div class="album-title">${escHtml(album.title)}</div>
        <div class="album-meta">
          <span>${album.photo_count} 张照片</span>
          <span class="album-badge ${album.is_public ? 'badge-public' : 'badge-private'}">
            ${album.is_public ? '🌐 公开' : '🔒 私密'}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

async function openAlbum(id) {
  showLoading();
  try {
    const album = await Albums.get(id);
    showAlbumDetail(album);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderAlbumDetail(album) {
  document.getElementById('detail-title').textContent = album.title;
  document.getElementById('detail-meta').textContent =
    `${album.photo_count} 张照片 · ${formatDate(album.created_at)}`;
  document.getElementById('detail-description').textContent = album.description || '';

  // Share button
  const shareBtn = document.getElementById('share-btn');
  shareBtn.textContent = album.is_public ? '🔗 取消分享' : '🔗 分享';

  // Share banner
  const banner = document.getElementById('share-banner');
  if (album.is_public && album.share_token) {
    banner.style.display = 'block';
    const shareUrl = `${window.location.origin}/share/${album.share_token}`;
    document.getElementById('share-link-input').value = shareUrl;
  } else {
    banner.style.display = 'none';
  }

  // Slideshow bar
  const slideshowBar = document.getElementById('slideshow-bar');
  if (album.photos && album.photos.length > 0) {
    slideshowBar.style.display = 'flex';
  } else {
    slideshowBar.style.display = 'none';
  }

  renderPhotosGrid(album.photos || []);
}

function renderPhotosGrid(photos) {
  const grid = document.getElementById('photos-grid');
  const empty = document.getElementById('photos-empty');

  if (photos.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = photos.map((photo, index) => `
    <div class="photo-item" onclick="openLightbox(currentAlbum.photos, ${index})">
      <img src="${Photos.imageUrl(photo.id)}" alt="${escHtml(photo.original_name)}" loading="lazy">
      <div class="photo-overlay">
        <span style="color:#fff;font-size:1.5rem;">🔍</span>
      </div>
      <button class="photo-delete-btn" onclick="handleDeletePhoto(event, ${photo.id})" title="删除">✕</button>
    </div>
  `).join('');
}

// ===== Create Album =====
async function handleCreateAlbum() {
  const title = document.getElementById('new-album-title').value.trim();
  const desc = document.getElementById('new-album-desc').value.trim();
  const isPublic = document.getElementById('new-album-public').checked;
  const alert = document.getElementById('create-album-alert');
  const btn = document.getElementById('create-album-btn');

  alert.classList.remove('show');
  if (!title) {
    alert.textContent = '请输入相册名称';
    alert.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await Albums.create(title, desc, isPublic);
    closeModal('create-album-modal');
    document.getElementById('new-album-title').value = '';
    document.getElementById('new-album-desc').value = '';
    document.getElementById('new-album-public').checked = false;
    showToast('相册创建成功！', 'success');
    loadAlbums();
  } catch (e) {
    alert.textContent = e.message;
    alert.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = '创建';
  }
}

// ===== Edit Album =====
function openEditAlbumModal() {
  if (!currentAlbum) return;
  document.getElementById('edit-album-title').value = currentAlbum.title;
  document.getElementById('edit-album-desc').value = currentAlbum.description || '';
  openModal('edit-album-modal');
}

async function handleEditAlbum() {
  if (!currentAlbum) return;
  const title = document.getElementById('edit-album-title').value.trim();
  const desc = document.getElementById('edit-album-desc').value.trim();

  if (!title) { showToast('相册名称不能为空', 'error'); return; }

  try {
    const updated = await Albums.update(currentAlbum.id, { title, description: desc });
    currentAlbum = { ...currentAlbum, ...updated };
    closeModal('edit-album-modal');
    showToast('相册已更新', 'success');
    // Reload detail
    const album = await Albums.get(currentAlbum.id);
    currentAlbum = album;
    renderAlbumDetail(album);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ===== Delete Album =====
async function handleDeleteAlbum() {
  if (!currentAlbum) return;
  if (!confirm(`确定要删除相册「${currentAlbum.title}」吗？\n相册内所有照片也会被删除，此操作不可撤销。`)) return;

  showLoading();
  try {
    await Albums.delete(currentAlbum.id);
    showToast('相册已删除', 'success');
    showAlbumList();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

// ===== Share =====
async function handleToggleShare() {
  if (!currentAlbum) return;
  try {
    const updated = await Albums.toggleShare(currentAlbum.id);
    const album = await Albums.get(currentAlbum.id);
    currentAlbum = album;
    renderAlbumDetail(album);
    showToast(album.is_public ? '分享链接已开启' : '相册已设为私密', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function copyShareLink() {
  const input = document.getElementById('share-link-input');
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('链接已复制到剪贴板', 'success');
  }).catch(() => {
    input.select();
    document.execCommand('copy');
    showToast('链接已复制', 'success');
  });
}

// ===== Upload =====
function openUploadModal() {
  selectedFiles = [];
  document.getElementById('file-input').value = '';
  document.getElementById('selected-files').style.display = 'none';
  document.getElementById('upload-progress').classList.remove('show');
  document.getElementById('upload-btn').disabled = true;
  document.getElementById('progress-bar').style.width = '0%';
  openModal('upload-modal');
}

function handleFileSelect(event) {
  selectedFiles = Array.from(event.target.files);
  updateFileList();
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}

function handleDragLeave(event) {
  document.getElementById('upload-zone').classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  selectedFiles = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  updateFileList();
}

function updateFileList() {
  const container = document.getElementById('selected-files');
  const countEl = document.getElementById('selected-count');
  const listEl = document.getElementById('file-list');
  const uploadBtn = document.getElementById('upload-btn');

  if (selectedFiles.length === 0) {
    container.style.display = 'none';
    uploadBtn.disabled = true;
    return;
  }

  container.style.display = 'block';
  uploadBtn.disabled = false;
  countEl.textContent = `已选择 ${selectedFiles.length} 张图片`;
  listEl.innerHTML = selectedFiles.map(f => `
    <div style="display:flex;justify-content:space-between;font-size:.8rem;padding:4px 0;border-bottom:1px solid var(--border);">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;">${escHtml(f.name)}</span>
      <span style="color:var(--text-muted);">${formatSize(f.size)}</span>
    </div>
  `).join('');
}

async function handleUpload() {
  if (!currentAlbum || selectedFiles.length === 0) return;

  const btn = document.getElementById('upload-btn');
  const progress = document.getElementById('upload-progress');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');

  btn.disabled = true;
  progress.classList.add('show');

  try {
    const photos = await Photos.upload(currentAlbum.id, selectedFiles, (pct) => {
      bar.style.width = pct + '%';
      text.textContent = `上传中... ${pct}%`;
    });

    bar.style.width = '100%';
    text.textContent = `上传完成！共 ${photos.length} 张`;

    setTimeout(async () => {
      closeModal('upload-modal');
      showToast(`成功上传 ${photos.length} 张照片`, 'success');
      // Reload album detail
      const album = await Albums.get(currentAlbum.id);
      currentAlbum = album;
      renderAlbumDetail(album);
    }, 800);
  } catch (e) {
    showToast(e.message, 'error');
    progress.classList.remove('show');
    btn.disabled = false;
  }
}

// ===== Delete Photo =====
async function handleDeletePhoto(event, photoId) {
  event.stopPropagation();
  if (!confirm('确定要删除这张照片吗？')) return;

  try {
    await Photos.delete(photoId);
    showToast('照片已删除', 'success');
    // Reload album
    const album = await Albums.get(currentAlbum.id);
    currentAlbum = album;
    renderAlbumDetail(album);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ===== Slideshow =====
function startSlideshowFromAlbum() {
  if (!currentAlbum || !currentAlbum.photos || currentAlbum.photos.length === 0) {
    showToast('相册中没有照片', 'error');
    return;
  }
  openLightbox(currentAlbum.photos, 0);
  setTimeout(() => {
    toggleSlideshow();
  }, 300);
}

// ===== Share Page =====
async function loadSharePage(token) {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('share-page').style.display = 'block';

  try {
    const album = await Albums.getShared(token);
    document.getElementById('share-album-title').textContent = album.title;
    document.getElementById('share-album-meta').textContent =
      `${album.photo_count} 张照片 · ${formatDate(album.created_at)}`;

    const grid = document.getElementById('share-photos-grid');
    const empty = document.getElementById('share-empty');

    if (!album.photos || album.photos.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = album.photos.map((photo, index) => `
      <div class="photo-item" onclick="openLightbox(sharePhotos, ${index})">
        <img src="${Photos.imageUrl(photo.id)}" alt="${escHtml(photo.original_name)}" loading="lazy">
        <div class="photo-overlay">
          <span style="color:#fff;font-size:1.5rem;">🔍</span>
        </div>
      </div>
    `).join('');

    // Store photos for lightbox
    window.sharePhotos = album.photos;
  } catch (e) {
    document.getElementById('share-album-title').textContent = '相册不存在';
    document.getElementById('share-album-meta').textContent = '分享链接无效或相册已设为私密';
  }
}

function startSlideshowFromShare() {
  if (!window.sharePhotos || window.sharePhotos.length === 0) {
    showToast('相册中没有照片', 'error');
    return;
  }
  openLightbox(window.sharePhotos, 0);
  setTimeout(() => toggleSlideshow(), 300);
}

// ===== Utilities =====
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
