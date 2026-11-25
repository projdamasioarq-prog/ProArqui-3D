const test = require('node:test');
const assert = require('node:assert/strict');
const { validConfig } = require('../server');
test('aceita configuração demonstrativa completa', () => {
  assert.equal(validConfig({ services: [], pricingRules: [], deadlines: [], whatsappNumber: '' }), true);
});
test('rejeita listas comerciais ausentes', () => {
  assert.equal(validConfig({ services: [], whatsappNumber: '' }), false);
});
test('rejeita configuração que não seja objeto', () => {
  assert.equal(validConfig(null), false);
});