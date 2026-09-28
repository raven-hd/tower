const GH_API = 'https://api.github.com';

function cors(env, origin) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowed === '*' ? '*' : (origin === allowed ? origin : allowed),
    'Access-Control-Allow-Headers': 'Content-Type, X-Editor-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type':'application/json; charset=utf-8', ...headers }
  });
}

function authorized(req, env) {
  const supplied = req.headers.get('X-Editor-Key') || '';
  return supplied && env.EDITOR_KEY && supplied === env.EDITOR_KEY;
}

async function gh(env, path, init={}) {
  const r = await fetch(GH_API + path, {
    ...init,
    headers: {
      'Accept':'application/vnd.github+json',
      'Authorization':'Bearer ' + env.GITHUB_TOKEN,
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'raven-hd-feather-worker',
      ...(init.headers || {})
    }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || ('GitHub HTTP ' + r.status));
  return data;
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary='';
  for (let i=0;i<bytes.length;i+=0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i+0x8000));
  }
  return btoa(binary);
}

function safeName(name) {
  return String(name || 'image').toLowerCase()
    .replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'image';
}

async function putFile(env, repoPath, contentBase64, message) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const encoded = repoPath.split('/').map(encodeURIComponent).join('/');
  let sha;
  try {
    const current = await gh(env, `/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`);
    sha = current.sha;
  } catch (e) {
    if (!String(e.message).includes('Not Found')) throw e;
  }
  return gh(env, `/repos/${owner}/${repo}/contents/${encoded}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ message, content:contentBase64, branch, ...(sha ? {sha} : {}) })
  });
}

export default {
  async fetch(req, env) {
    const origin=req.headers.get('Origin') || '';
    const ch=cors(env, origin);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:ch});

    const url=new URL(req.url);
    if (url.pathname === '/health') return json({ok:true},200,ch);

    if (url.pathname === '/api/archive' && req.method === 'POST') {
      if (!authorized(req, env)) return json({error:'Неверный ключ редактора'},401,ch);
      try {
        const body=await req.json();
        const data=body.data;
        if (!data || data.version !== 2 || !Array.isArray(data.archive)) {
          return json({error:'Неверная структура архива'},400,ch);
        }
        if (data.archive.length > 1000) return json({error:'Слишком много выпусков'},400,ch);
        const content=JSON.stringify(data,null,2) + '\n';
        const result=await putFile(env, env.ARCHIVE_PATH || 'feather/data/archive.json', toBase64Utf8(content), body.message || 'Перышко: обновление архива');
        return json({ok:true, commit:result.commit?.sha || null},200,ch);
      } catch (e) {
        return json({error:e.message || 'Ошибка сохранения'},500,ch);
      }
    }

    if (url.pathname === '/api/upload' && req.method === 'POST') {
      if (!authorized(req, env)) return json({error:'Неверный ключ редактора'},401,ch);
      try {
        const body=await req.json();
        const b64=String(body.base64 || '').replace(/^data:[^;]+;base64,/, '');
        if (!b64 || b64.length > 5_500_000) return json({error:'Файл пустой или слишком большой'},400,ch);
        const ext=(String(body.filename||'').match(/\.(png|jpe?g|webp|gif)$/i)||[])[1];
        if (!ext) return json({error:'Разрешены png, jpg, jpeg, webp, gif'},400,ch);
        const d=new Date();
        const folder=`${d.getUTCFullYear()}/${String(d.getUTCMonth()+1).padStart(2,'0')}`;
        const filename=`${Date.now()}-${safeName(body.filename)}`;
        const base=(env.UPLOAD_PATH || 'feather/img/uploads').replace(/\/$/,'');
        const repoPath=`${base}/${folder}/${filename}`;
        await putFile(env, repoPath, b64, `Перышко: добавлено изображение ${filename}`);
        const publicPath='./' + repoPath.replace(/^feather\//,'');
        return json({ok:true, path:publicPath, repoPath},200,ch);
      } catch (e) {
        return json({error:e.message || 'Ошибка загрузки'},500,ch);
      }
    }

    return json({error:'Not found'},404,ch);
  }
};
