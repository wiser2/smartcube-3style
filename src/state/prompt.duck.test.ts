import { generatePrompts, getTrainablePairs } from './prompt.duck';
import { TrainingSettings } from './settings.duck';

const SETTINGS_BASE: TrainingSettings = {
  pieceType: 'corners',
  includeInverses: false,
  includeTwists: false,
  buffer: 'UFR',
  letterScheme: 'ADCBEHGFILKJMPONQTSRUXWV',
  selectedLetters: ['D'],
  selectedPairs: [],
};


describe('generatePrompts', () => {
  it('should generate prompts without inverses or twists', () => {
    const settings = {
      ...SETTINGS_BASE,
    };
    const prompts = generatePrompts(settings);
    const expected = [
      'DA', 'DB', 'DE', 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DN', 'DO', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX'
    ];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should generate prompts without inverses but with twists', () => {
    const settings = {
      ...SETTINGS_BASE,
      includeTwists: true,
    };
    const prompts = generatePrompts(settings);
    const expected = [
      'DA', 'DB', 'DE', 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DN', 'DO', 'DP', 'DQ', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX'
    ];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should generate only selected pairs when selectedPairs is non-empty', () => {
    const settings = {
      ...SETTINGS_BASE,
      selectedPairs: ['DA', 'DB', 'AD'],
    };
    const prompts = generatePrompts(settings);
    const expected = ['DA', 'DB', 'AD'];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should expose trainable pairs sorted, with inverses when enabled', () => {
    const settings = {
      ...SETTINGS_BASE,
      includeInverses: true,
      selectedPairs: ['DA'],
    };
    const pairs = getTrainablePairs(settings);
    expect(pairs).toEqual(['AD', 'DA']);
  });

  it('should drop invalid selected pairs', () => {
    const settings = {
      ...SETTINGS_BASE,
      selectedPairs: ['DA', 'DP', 'DC', 'DD', 'XA'],
    };
    // 'DP' shares a piece with 'D', 'DC' shares a piece with the buffer and
    // 'DD' repeats the same letter. 'XA' is kept.
    const prompts = generatePrompts(settings);
    const expected = ['DA', 'XA'];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should allow same-piece selected pairs with twists', () => {
    const settings = {
      ...SETTINGS_BASE,
      includeTwists: true,
      selectedPairs: ['DA', 'DP'],
    };
    const prompts = generatePrompts(settings);
    const expected = ['DA', 'DP'];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should generate prompts with inverses but not twists', () => {
    const settings = {
      ...SETTINGS_BASE,
      includeInverses: true,
    };
    const prompts = generatePrompts(settings);
    const expected = [
      'DA', 'DB', 'DE', 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DN', 'DO', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX',
      'AD', 'BD', 'ED', 'FD', 'GD', 'HD', 'ID', 'JD', 'KD', 'ND', 'OD', 'RD', 'SD', 'TD', 'UD', 'VD', 'WD', 'XD'
    ];
    expect(prompts.sort()).toEqual(expected.sort());
  });

  it('should generate prompts without inverses or twists', () => {
    const settings = {
      ...SETTINGS_BASE,
      includeInverses: true,
      includeTwists: true,
    };
    const prompts = generatePrompts(settings);
    const expected = [
      'DA', 'DB', 'DE', 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DN', 'DO', 'DP', 'DQ', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX',
      'AD', 'BD', 'ED', 'FD', 'GD', 'HD', 'ID', 'JD', 'KD', 'ND', 'OD', 'PD', 'QD', 'RD', 'SD', 'TD', 'UD', 'VD', 'WD', 'XD'
    ];
    expect(prompts.sort()).toEqual(expected.sort());
  });
});