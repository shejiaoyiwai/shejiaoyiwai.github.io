/* ========================================
   社交意外 - 主逻辑 app.js
   ======================================== */

const STATE = {
  allJokes: [],
  filtered: [],
  currentCategory: 'all',
  currentTag: '',
  currentSearch: '',
  currentPage: 1,
  pageSize: 10,
  darkMode: false,
};

// ---- 初始化 ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initTheme();
  initIntro();
  bindEvents();
  showRandomJoke();
  buildWordCloud();
  updateStats();
});

// ---- 加载数据 ----
async function loadData() {
  try {
    const [res1, res2] = await Promise.all([
      fetch('data/抽象段子_整合_v2.json'),
      fetch('data/情感段子_整合.json'),
    ]);
    const data1 = await res1.json();
    const data2 = await res2.json();

    const jokes1 = (data1.jokes || []).map(j => ({ ...j, _cat: 'abstract' }));
    const jokes2 = (data2.jokes || []).map(j => ({ ...j, _cat: 'emotion' }));

    STATE.allJokes = [...jokes1, ...jokes2];
    console.log(`✅ 加载段子共 ${STATE.allJokes.length} 条`);
  } catch (e) {
    console.error('加载数据失败:', e);
    document.getElementById('heroText').textContent = '数据加载失败，请检查 data/ 目录下的 JSON 文件。';
  }
}

// ---- 主题 ----
function initTheme() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️';
    STATE.darkMode = true;
  }
}
function toggleTheme() {
  STATE.darkMode = !STATE.darkMode;
  document.body.classList.toggle('dark', STATE.darkMode);
  localStorage.setItem('darkMode', STATE.darkMode);
  document.getElementById('themeToggle').textContent = STATE.darkMode ? '☀️' : '🌙';
}

// ---- 简介区域 ----
function initIntro() {
  const saved = localStorage.getItem('siteIntro');
  if (saved) {
    document.getElementById('introText').textContent = saved;
  }
  document.getElementById('introText').addEventListener('input', e => {
    localStorage.setItem('siteIntro', e.target.textContent);
  });
}

// ---- 事件绑定 ----
function bindEvents() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      STATE.currentCategory = btn.dataset.category;
      STATE.currentTag = '';
      STATE.currentSearch = '';
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.wc-tag').forEach(t => t.classList.remove('active'));
      showRandomJoke();
    });
  });

  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      STATE.currentSearch = e.target.value.trim();
      STATE.currentTag = '';
      document.querySelectorAll('.wc-tag').forEach(t => t.classList.remove('active'));
      if (STATE.currentSearch) {
        doSearch(STATE.currentSearch);
      } else {
        showRandomJoke();
      }
    }, 300);
  });

  document.getElementById('btnRefresh').addEventListener('click', showRandomJoke);

  document.getElementById('btnBack').addEventListener('click', () => {
    STATE.currentSearch = '';
    STATE.currentTag = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('resultList').style.display = 'none';
    document.getElementById('heroCard').style.display = '';
    document.querySelectorAll('.wc-tag').forEach(t => t.classList.remove('active'));
    showRandomJoke();
  });
}

// ---- 随机展示 ----
function showRandomJoke() {
  const pool = getPool();
  if (!pool.length) {
    setHeroContent('暂无数据', '', '', '');
    return;
  }
  const joke = pool[Math.floor(Math.random() * pool.length)];
  const tag = joke.ai_tag || '其他';
  const emoji = joke.ai_tag_emoji || '📌';
  setHeroContent(
    joke.text,
    `${emoji} ${tag}`,
    getDisplaySource(joke.source_file || ''),
    joke.original_date || ''
  );
  document.getElementById('heroCard').classList.remove('fade-in');
  void document.getElementById('heroCard').offsetWidth;
  document.getElementById('heroCard').classList.add('fade-in');
}

function setHeroContent(text, badge, source, date) {
  document.getElementById('heroText').textContent = text;
  document.getElementById('heroBadge').textContent = badge;
  document.getElementById('heroSource').textContent = source ? `📄 ${source}` : '';
  document.getElementById('heroDate').textContent = date ? `🕐 ${date}` : '';
  document.getElementById('jokeCount').textContent = `共 ${getPool().length} 条`;
  document.getElementById('heroCard').style.display = '';
  document.getElementById('resultList').style.display = 'none';
}

function getPool() {
  let pool = STATE.allJokes;
  if (STATE.currentCategory === 'abstract') pool = pool.filter(j => j._cat === 'abstract');
  if (STATE.currentCategory === 'emotion') pool = pool.filter(j => j._cat === 'emotion');
  if (STATE.currentTag) pool = pool.filter(j => j.ai_tag === STATE.currentTag);
  return pool;
}

// ---- 搜索 ----
function doSearch(keyword) {
  const pool = getPool();
  const kw = keyword.toLowerCase();
  STATE.filtered = pool.filter(j => j.text.toLowerCase().includes(kw));
  STATE.currentPage = 1;
  renderSearchResults();
}

function renderSearchResults() {
  const container = document.getElementById('resultContainer');
  const pagination = document.getElementById('pagination');
  const start = (STATE.currentPage - 1) * STATE.pageSize;
  const pageItems = STATE.filtered.slice(start, start + STATE.pageSize);

  document.getElementById('heroCard').style.display = 'none';
  document.getElementById('resultList').style.display = '';

  const title = STATE.currentTag
    ? `🏷️ ${STATE.currentTag} — 共 ${STATE.filtered.length} 条`
    : STATE.currentSearch
      ? `搜索"${STATE.currentSearch}" — 共 ${STATE.filtered.length} 条`
      : `共 ${STATE.filtered.length} 条`;
  document.getElementById('resultTitle').textContent = title;

  container.innerHTML = pageItems.map(j => `
    <div class="result-card fade-in">
      <div class="result-card-tag">${j.ai_tag_emoji || '📌'} ${j.ai_tag || '其他'}</div>
      <div class="joke-text">${escapeHtml(j.text)}</div>
      <div class="card-footer">
        <span>📄 ${getDisplaySource(j.source_file || '')}</span>
        <span>${j.original_date ? '🕐 ' + j.original_date : ''}</span>
      </div>
    </div>
  `).join('');

  const totalPages = Math.ceil(STATE.filtered.length / STATE.pageSize) || 1;
  pagination.innerHTML = '';
  for (let i = 1; i <= Math.min(totalPages, 10); i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === STATE.currentPage ? ' active' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      STATE.currentPage = i;
      renderSearchResults();
    });
    pagination.appendChild(btn);
  }
}

// ---- 词云：基于实际标签分布 ----
function buildWordCloud() {
  const pool = STATE.allJokes;
  const counts = {};
  pool.forEach(j => {
    const t = j.ai_tag || '其他';
    counts[t] = (counts[t] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  const minCount = sorted.length ? sorted[sorted.length - 1][1] : 0;
  const maxCount = sorted.length ? sorted[0][1] : 1;

  const cloud = document.getElementById('wordcloud');
  cloud.innerHTML = '';

  if (!sorted.length) {
    cloud.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem">暂无标签数据</span>';
    return;
  }

  // emoji 映射
  const emojiMap = {
    "群聊互动":"💬","网络用语":"🌐","抽象文化":"🤪","网友吐槽":"😤",
    "群规公告":"📢","搞笑名场面":"😂","社交规则":"📋","职场吐槽":"💼",
    "恋爱关系":"💕","男女差异":"⚖️","婚姻家庭":"💍","情感感悟":"💭",
    "相亲征婚":"👀","分手离婚":"💔","友情友情":"🤝","家庭关系":"🏠",
    "人性洞察":"🔍","金钱话题":"💰","健康生活":"🏃","校园时光":"📚",
    "节日节气":"🎉","购物消费":"🛒","追星八卦":"🌟","宠物日常":"🐱",
    "语言艺术":"🎤","深夜emo":"🌙","其他":"📌",
  };

  sorted.forEach(([tagName, count]) => {
    const size = 12 + (count - minCount) / (maxCount - minCount || 1) * 16;
    const tagEl = document.createElement('span');
    tagEl.className = 'wc-tag';
    tagEl.textContent = `${emojiMap[tagName] || '📌'} ${tagName}`;
    tagEl.style.fontSize = size + 'px';
    tagEl.addEventListener('click', () => {
      STATE.currentTag = tagName;
      STATE.currentSearch = '';
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.wc-tag').forEach(t => t.classList.remove('active'));
      tagEl.classList.add('active');
      STATE.filtered = getPool();
      STATE.currentPage = 1;
      renderSearchResults();
    });
    cloud.appendChild(tagEl);
  });
}

// ---- 统计 ----
function updateStats() {
  const total = STATE.allJokes.length;
  const abs = STATE.allJokes.filter(j => j._cat === 'abstract').length;
  const emo = STATE.allJokes.filter(j => j._cat === 'emotion').length;
  document.getElementById('statsText').textContent =
    `✨ 社交意外 · 共收录 ${total} 条 · 抽象 ${abs} 条 · 情感 ${emo} 条`;
}

// ---- 来源文件名映射 ----
const SOURCE_FILE_MAP = {
  'fuck微信群聊（群规、退群）.md':            '抽象2019.md',
  '微信群聊梗收集（2023年前）.md':             '抽象2022.md',
  '盗版人类微信群（抽象）2024.md':             '抽象2024.md',
  '盗版群（抽象）（2025）.md':                '抽象2025.md',
  '盗版群（抽象）（2026）.md':                '抽象2026.md',
  '男女之间沟通和情感（2026）.md':            '情感2026.md',
  '男女之间的沟通与情感（2020年之前）.md':      '情感2019.md',
  '男女之间的沟通与情感（2020年）.md':         '情感2020.md',
  '男女之间的沟通与情感（2021年）.md':         '情感2021.md',
  '男女之间的沟通与情感（2022年）.md':         '情感2022.md',
  '男女之间的沟通与情感（2023年）.md':         '情感2023.md',
  '男女之间的沟通与情感（2024年）.md':         '情感2024.md',
  '男女之间的沟通与情感（2025年）.md':         '情感2025.md',
};

function getDisplaySource(filename) {
  return SOURCE_FILE_MAP[filename] || filename.replace('.md', '');
}

// ---- 工具 ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
