const API_TOKEN = window.electronAPI.apiToken;
const API_BASE = 'https://api.ticktick.com/open/v1';
let allTasks = [];
let firstLoad = true;
let isOffline = !navigator.onLine;
let retryTimer = null;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('newTask').addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
  });
  fetchTasks();
  setInterval(fetchTasks, 30000);
});

// Deteção offline/online
window.addEventListener('offline', () => {
  isOffline = true;
  setStatus('offline');
  renderTasks();
  scheduleRetry();
});
window.addEventListener('online', () => {
  isOffline = false;
  clearRetry();
  setStatus('');
  fetchTasks();
});

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    clearRetry();       // limpar antes de tentar (fetchTasks reagenda se falhar)
    isOffline = false;
    setStatus('');
    fetchTasks();
  }, 5000);
}

function clearRetry() {
  if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }
}

function setStatus(msg) {
  const el = document.getElementById('statusBar');
  if (msg) {
    el.textContent = msg;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

async function fetchTasks() {
  if (isOffline) {
    setStatus('offline');
    renderTasks();
    scheduleRetry();
    return;
  }

  // Só mostra loading na primeira carga; atualizações são silenciosas
  if (firstLoad) {
    document.getElementById('taskList').innerHTML =
      '<div class="empty-msg">a carregar…</div>';
  }

  try {
    const [projectsRes, inboxRes] = await Promise.all([
      api.get('/project'),
      api.get('/project/inbox/data')
    ]);

    const projects = projectsRes.data || [];
    let tasks = (inboxRes.data?.tasks || []).map(t => ({ ...t, projectName: null }));

    for (const project of projects) {
      try {
        const res = await api.get(`/project/${project.id}/data`);
        const pt = (res.data?.tasks || []).map(t => ({ ...t, projectName: project.name }));
        tasks = tasks.concat(pt);
      } catch (_) {}
    }

    allTasks = tasks.map(t => ({ ...t, done: t.status === 2 }));
    firstLoad = false;
    setStatus('');
    renderTasks();
  } catch (error) {
    console.error('fetchTasks error:', error.response ? `HTTP ${error.response.status}` : error.message);
    if (!navigator.onLine) {
      isOffline = true;
    }
    if (firstLoad) {
      setStatus('a tentar novamente…');
      document.getElementById('taskList').innerHTML =
        '<div class="empty-msg">sem ligação</div>';
      scheduleRetry();
    } else {
      setStatus('erro ao sincronizar');
      setTimeout(() => setStatus(''), 5000);
    }
  }
}

function renderTasks() {
  const container = document.getElementById('taskList');
  const pendentes = allTasks.filter(t => !t.done);
  const concluidas = allTasks.filter(t => t.done);

  // Adiciona badge offline por cima se necessário
  const offlineBadge = isOffline
    ? '<div class="offline-badge" style="margin-bottom:6px">● offline</div>'
    : '';

  if (pendentes.length === 0 && concluidas.length === 0) {
    container.innerHTML = offlineBadge + '<div class="empty-msg">sem tarefas pendentes</div>';
    return;
  }

  const taskHtml = task => `
    <div class="task${task.done ? ' completed' : ''}">
      <input type="checkbox" ${task.done ? 'checked' : ''}
        onchange="toggleTask('${task.id}', this.checked)">
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.projectName ? `<div class="task-project">${escapeHtml(task.projectName)}</div>` : ''}
      </div>
      <button class="btn-del" onclick="deleteTask('${task.id}')">✕</button>
    </div>`;

  let html = offlineBadge;
  html += pendentes.map(taskHtml).join('');

  if (concluidas.length > 0) {
    html += '<div class="section-sep"></div>';
    html += concluidas.map(taskHtml).join('');
  }

  container.innerHTML = html;
}

async function toggleTask(taskId, isChecked) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;
  task.done = isChecked;
  task.status = isChecked ? 2 : 0;
  renderTasks(); // atualizar imediatamente, sem esperar API
  try {
    if (isChecked) {
      await api.post(`/project/${task.projectId}/task/${taskId}/complete`);
    } else {
      await api.post(`/task/${taskId}`, {
        id: taskId,
        projectId: task.projectId,
        title: task.title,
        status: 0
      });
    }
  } catch (e) {
    console.error('toggleTask error:', e.response?.data || e.message);
    // reverter se falhar
    task.done = !isChecked;
    task.status = isChecked ? 0 : 2;
    renderTasks();
  }
}

async function addTask() {
  const input = document.getElementById('newTask');
  const title = input.value.trim();
  if (!title) return;

  // Otimista: adicionar de imediato
  const temp = { id: '_tmp_' + Date.now(), title, done: false, projectName: null, projectId: 'inbox', status: 0 };
  allTasks.unshift(temp);
  input.value = '';
  renderTasks();

  try {
    const res = await api.post('/task', { title });
    // Substituir temp pela tarefa real
    const idx = allTasks.findIndex(t => t.id === temp.id);
    if (idx !== -1) allTasks[idx] = { ...res.data, done: false, projectName: null };
    renderTasks();
  } catch (e) {
    // Remover temp se falhou
    allTasks = allTasks.filter(t => t.id !== temp.id);
    input.value = title;
    renderTasks();
    setStatus('erro ao criar tarefa');
    setTimeout(() => setStatus(''), 4000);
  }
}

async function deleteTask(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  // Otimista: remover de imediato
  allTasks = allTasks.filter(t => t.id !== taskId);
  renderTasks();

  try {
    await api.delete(`/project/${task.projectId}/task/${taskId}`);
  } catch (e) {
    // Restaurar se falhou
    allTasks.unshift(task);
    renderTasks();
  }
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
