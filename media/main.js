(() => {
  const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
  const state = { model: null, page: 0, query: '' };
  const $ = id => document.getElementById(id);

  function attr(node, name) { return node?.getAttribute(name) || ''; }
  function shortPath(value) {
    const names = [...value.matchAll(/local-name\(\)='([^']+)'/g)].map(match => match[1]).filter(name => name !== '<Schema>');
    return names.length ? names.join(' / ') : value || 'Unconnected';
  }
  function leaf(value) { const parts = shortPath(value).split(' / '); return parts.at(-1); }

  function parseMap(fileName, source) {
    const xml = new DOMParser().parseFromString(source, 'application/xml');
    const parseError = xml.querySelector('parsererror');
    if (parseError) throw new Error(`Invalid BTM XML: ${parseError.textContent.split('\n')[0]}`);
    const root = xml.documentElement;
    if (root.localName.toLowerCase() !== 'mapsource') throw new Error('This file is not a BizTalk mapsource document.');
    const tree = selector => {
      const node = xml.querySelector(selector);
      return { root: attr(node, 'RootNode_Name'), reference: attr(node?.querySelector('Reference'), 'Location') };
    };
    const pages = [...xml.querySelectorAll('Pages > Page')].map((page, pageIndex) => {
      const functoids = new Map([...page.querySelectorAll('Functoids > Functoid')].map(node => {
        const id = attr(node, 'FunctoidID');
        const constants = [...node.querySelectorAll('Parameter[Type="constant"]')].map(p => attr(p, 'Value'));
        const scripts = [...node.querySelectorAll('Script')].map(s => ({ language: attr(s, 'Language'), code: s.textContent.trim() }));
        return [id, { id, fid: attr(node, 'Functoid-FID'), constants, scripts }];
      }));
      const links = [...page.querySelectorAll('Links > Link')].map(node => {
        const from = attr(node, 'LinkFrom'); const to = attr(node, 'LinkTo');
        const fromFunctoid = functoids.get(from); const toFunctoid = functoids.get(to);
        return { id: attr(node, 'LinkID'), from, to, fromFunctoid, toFunctoid };
      });
      return { name: attr(page, 'Name') || `Page ${pageIndex + 1}`, links, functoids: [...functoids.values()] };
    });
    return { fileName, name: attr(root, 'Name') || fileName, version: attr(root, 'Version'), source: tree('SrcTree'), target: tree('TrgTree'), pages };
  }

  function endpoint(value, functoid, side) {
    if (!functoid) return `<div class="endpoint"><strong title="${escape(value)}">${escape(leaf(value))}</strong><small>${escape(shortPath(value))}</small></div>`;
    const detail = [functoid.constants.length ? `Constants: ${functoid.constants.join(', ')}` : '', ...functoid.scripts.map(s => `${s.language}: ${s.code}`)].filter(Boolean).join(' · ');
    return `<div class="endpoint functoid"><strong>Functoid ${escape(functoid.fid || functoid.id)}</strong><small>${escape(detail || `${side} connector`)}</small></div>`;
  }
  function escape(value) { const span = document.createElement('span'); span.textContent = value || ''; return span.innerHTML; }

  function render() {
    const model = state.model; if (!model) return;
    $('title').textContent = model.fileName;
    $('sourceRoot').textContent = model.source.root || 'Unknown source root'; $('sourceRef').textContent = model.source.reference;
    $('targetRoot').textContent = model.target.root || 'Unknown target root'; $('targetRef').textContent = model.target.reference;
    const allLinks = model.pages.reduce((sum, page) => sum + page.links.length, 0);
    const allFunctoids = model.pages.reduce((sum, page) => sum + page.functoids.length, 0);
    $('stats').innerHTML = `<span class="pill">${allLinks} links</span><span class="pill">${allFunctoids} functoids</span><span class="pill">${model.pages.length} pages</span>`;
    $('page').innerHTML = model.pages.map((page, index) => `<option value="${index}" ${index === state.page ? 'selected' : ''}>${escape(page.name)}</option>`).join('');
    const page = model.pages[state.page];
    if (!page) { $('map').innerHTML = '<div class="empty">No map pages found.</div>'; return; }
    const query = state.query.toLowerCase();
    const links = page.links.filter(link => JSON.stringify(link).toLowerCase().includes(query));
    $('map').innerHTML = links.length ? links.map(link => `<article class="mapping">${endpoint(link.from, link.fromFunctoid, 'Source')}<div class="flow">Link ${escape(link.id)} →</div>${endpoint(link.to, link.toFunctoid, 'Target')}</article>`).join('') : '<div class="empty">No mappings match this filter.</div>';
  }

  $('page').addEventListener('change', event => { state.page = Number(event.target.value); render(); });
  $('search').addEventListener('input', event => { state.query = event.target.value; render(); });
  $('fit').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('message', event => {
    if (event.data?.type !== 'openMap') return;
    try { state.model = parseMap(event.data.fileName || 'map.btm', event.data.source); state.page = 0; $('error').hidden = true; render(); }
    catch (error) { $('error').textContent = error instanceof Error ? error.message : String(error); $('error').hidden = false; $('map').innerHTML = ''; }
  });
  vscode?.postMessage({ type: 'ready' });
})();
