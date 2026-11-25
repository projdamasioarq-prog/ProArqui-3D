const test = require('node:test');
const assert = require('node:assert/strict');
const { validConfig, estimateFor, deadlineFor } = require('../server');
test('aceita configuração demonstrativa completa', () => {
  assert.equal(validConfig({ services: [], pricingRules: [], deadlines: [], whatsappNumber: '' }), true);
});
test('rejeita listas comerciais ausentes', () => {
  assert.equal(validConfig({ services: [], whatsappNumber: '' }), false);
});
test('rejeita configuração que não seja objeto', () => {
  assert.equal(validConfig(null), false);
});
test('não inventa valor quando não há regra de preço', () => {
  assert.equal(estimateFor('Projeto novo', 100, []), null);
});
test('calcula preço por m² somente com regra explícita', () => {
  assert.deepEqual(estimateFor('Interiores', 50, [{ service: 'Interiores', type: 'per_m2', rate: 12 }]), {
    amount: 600, currency: 'BRL', basis: 'área informada × valor por m² cadastrado'
  });
});
test('não estima prazo sem regra aprovada', () => {
  assert.equal(deadlineFor('Reforma', []), null);
});
