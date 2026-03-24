export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const { sku, title } = req.body || {};
  if (!title) { res.status(400).json({ error: 'title required' }); return; }
  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key. Pasala como header x-api-key o configura ANTHROPIC_API_KEY en Vercel.' }); return; }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        system: "Sos un experto en productos de consumo masivo para el canal B2B de BEES (Quilmes). Escribis descripciones para kioscos y almacenes.\nREGLAS:\n- NO repetir marca/variedad/calibre/presentacion del titulo\n- NO links ni lenguaje tecnico\n- SI: que es, para que sirve, que lo diferencia\n- Directo, con personalidad\n- MAXIMO 300 CARACTERES absoluto\n- 1-2 oraciones, sin vinetas, Espanol Argentina",
        messages: [{ role: 'user', content: 'Producto: ' + title + '\nSKU: ' + (sku||'') + '\n\nDescripcion (solo texto, max 300 caracteres):' }]
      })
    });
    const data = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: data.error?.message || 'API error ' + r.status }); return; }
    const text = (data.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('').trim();
    res.status(200).json({ description: text });
  } catch(e) { res.status(500).json({ error: e.message }); }
}