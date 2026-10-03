import { test, expect } from '@playwright/test';

test('AI Search API should return an answer and source', async ({ request }) => {
  const response = await request.post('/api/search', {
    data: { question: 'What is the parental leave policy?' }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.answer).toContain('parental leave');
  expect(body.source).toBe('demo-knowledge-base');
});
