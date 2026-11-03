import { getInverseAlgorithm } from './pairs.duck';

describe('getInverseAlgorithm', () => {
  it('should swap the parts of a commutator', () => {
    expect(getInverseAlgorithm("[R U R', D']")).toBe("[D', R U R']");
  });

  it('should trim the stored value', () => {
    expect(getInverseAlgorithm('  [A B, C]  ')).toBe('[C, A B]');
  });

  it('should swap only the top-level parts of nested commutators', () => {
    expect(getInverseAlgorithm('[[R U R\', D\'], E]')).toBe('[E, [R U R\', D\']]');
  });

  it('should reverse and invert plain move sequences', () => {
    expect(getInverseAlgorithm('R U R\' D\'')).toBe('D R U\' R\'');
    expect(getInverseAlgorithm('M2')).toBe('M2');
    expect(getInverseAlgorithm("R U2 R'")).toBe("R U2 R'");
  });

  it('should return brackets without a comma unchanged', () => {
    expect(getInverseAlgorithm('[R U R\']')).toBe('[R U R\']');
  });

  it('should return empty values unchanged', () => {
    expect(getInverseAlgorithm('')).toBe('');
  });
});
