const http = require('http');

function postJson(urlString, body) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const req = http.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from AI Search API: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = class AISearchProvider {
  id() { return 'ai-search-http'; }

  async callApi(prompt, context) {
    const baseUrl = process.env.AI_SEARCH_URL || 'http://127.0.0.1:3000/api/search';
    const question = context?.vars?.question || prompt;
    const result = await postJson(baseUrl, { question });
    return {
      output: result.answer,
      metadata: { source: result.source, question }
    };
  }
};
