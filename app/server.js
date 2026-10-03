const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT || 3000);

const knowledge = [
  {
    keywords: ['parental', 'leave'],
    answer: 'Employees are eligible for parental leave according to the company leave policy. The exact entitlement depends on the applicable employee category and location; employees should check the current HR policy for the authoritative duration.'
  },
  {
    keywords: ['vacation', 'days', 'annual leave'],
    answer: 'Employees receive annual vacation leave according to their applicable employment policy. The exact number of days can vary by employee category and location.'
  },
  {
    keywords: ['refund', 'return'],
    answer: 'Refund requests can be submitted through the Returns and Refunds section. Eligibility and processing time depend on the item and return policy.'
  }
];

function answerFor(question) {
  const q = String(question || '').toLowerCase();
  const hit = knowledge.find(item => item.keywords.some(k => q.includes(k)));
  if (hit) return hit.answer;
  return 'I could not find a reliable answer in the available knowledge base. Please contact support or provide more context.';
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AI Search Demo</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:60px auto;padding:0 20px}input{width:70%;padding:12px}button{padding:12px 20px}#response{margin-top:25px;padding:20px;border:1px solid #ddd;border-radius:8px;min-height:50px}.status{margin-top:10px;color:#666}</style>
</head><body>
<h1>AI Search</h1>
<p>Playwright + Promptfoo demo application.</p>
<label for="question">Ask a question</label><br><br>
<input id="question" placeholder="Ask a question" aria-label="Ask a question" />
<button id="search" type="button">Search</button>
<div class="status" id="status"></div>
<div id="response" data-testid="ai-response" aria-live="polite"></div>
<script>
async function search(){
 const question=document.getElementById('question').value;
 document.getElementById('status').textContent='Searching...';
 const r=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
 const data=await r.json();
 document.getElementById('status').textContent='Complete';
 document.getElementById('response').textContent=data.answer;
}
document.getElementById('search').addEventListener('click',search);
document.getElementById('question').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
</script></body></html>`;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'GET' && parsed.pathname === '/') {
    res.writeHead(200, {'Content-Type':'text/html'}); res.end(html); return;
  }
  if (req.method === 'POST' && parsed.pathname === '/api/search') {
    let body='';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const answer = answerFor(payload.question);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({question: payload.question, answer, source:'demo-knowledge-base'}));
      } catch (e) {
        res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Invalid JSON'}));
      }
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => console.log(`AI Search demo running at http://127.0.0.1:${PORT}`));
