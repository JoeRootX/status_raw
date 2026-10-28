import assert from 'node:assert/strict';
import test from 'node:test';
import { jqlAlternativo } from '../lib/jira';

test('sin JQL alternativo la segunda bandeja queda apagada', () => {
  assert.equal(jqlAlternativo(undefined), null);
  assert.equal(jqlAlternativo(''), null);
  assert.equal(jqlAlternativo('   '), null);
});

test('el JQL alternativo configurado se usa tal cual, sin espacios de sobra', () => {
  const jql = 'assignee = currentUser() AND project = OTRO ORDER BY updated DESC';
  assert.equal(jqlAlternativo(jql), jql);
  assert.equal(jqlAlternativo(`  ${jql}  `), jql);
});
