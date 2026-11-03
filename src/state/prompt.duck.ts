import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

import {
  selectLetterScheme,
  TrainingSettings,
  selectSettingsForCurrentPiece,
  selectBufferIndex
} from "./settings.duck";

import { setTarget } from './cube.duck';
import { getIndicesForSharedStickers, stickerToIndex } from '../lib/cube/cube';

// Helper functions
// A pair can be selected when both letters map to stickers that can be 3-cycled
// together: neither may share a piece with the buffer, and (without twists) the
// two letters may not share a piece with each other.
export function isPairSelectable(settings: TrainingSettings, first: string, second: string): boolean {
  if (first.length !== 1 || second.length !== 1 || first === second) {
    return false;
  }
  const pieceType = settings.pieceType;
  const firstIndex = settings.letterScheme.indexOf(first);
  const secondIndex = settings.letterScheme.indexOf(second);
  if (firstIndex < 0 || secondIndex < 0) {
    return false;
  }
  const bufferIndices = getIndicesForSharedStickers(
    stickerToIndex(settings.buffer, pieceType), pieceType);
  if (bufferIndices.includes(firstIndex) || bufferIndices.includes(secondIndex)) {
    return false;
  }
  if (!settings.includeTwists &&
      getIndicesForSharedStickers(firstIndex, pieceType).includes(secondIndex)) {
    return false;
  }
  return true;
}

// Helper functions
function shuffle(array: any[]): Array<any>{
  let remaining = array.length;
  let randomIndex: number;

  while (remaining) {
    randomIndex = Math.floor(Math.random() * remaining);
    remaining--;
    [array[remaining], array[randomIndex]] = [array[randomIndex], array[remaining]];
  }

  return array;
}

// Every valid pair for these settings (all letters except ones sharing a piece
// with the buffer), regardless of which letters or pairs are selected, sorted
// alphabetically.
export function getAllSelectablePairs(settings: TrainingSettings): string[] {
  const bufferIndices = getIndicesForSharedStickers(
    stickerToIndex(settings.buffer, settings.pieceType), settings.pieceType);
  const availableLetters = settings.letterScheme.split('').filter((_, index) =>
    !bufferIndices.includes(index)
  );

  const pairs: string[] = [];
  availableLetters.forEach((first) =>
    availableLetters.forEach((second) => {
      if (isPairSelectable(settings, first, second)) {
        pairs.push(first + second);
      }
    })
  );
  return pairs.sort();
}

// All pairs the trainer may present for these settings (the chosen pairs, or
// every pair for the selected letters), including inverses when they are
// enabled, deduped and sorted alphabetically.
export function getTrainablePairs(settings: TrainingSettings): string[] {
  const selectedPairs = settings.selectedPairs ?? [];
  const prompts = selectedPairs.length > 0
    // Train only the user's chosen pairs, dropping any that are invalid.
    ? selectedPairs.filter((pair) =>
        isPairSelectable(settings, pair[0], pair[1] ?? '')
      )
    : generateAllPairPrompts(settings);

  const withInverses = settings.includeInverses
    ? [...prompts, ...prompts.map((prompt) => prompt.split('').reverse().join(''))]
    : prompts;
  // Inverses introduce duplicates when more than one letter is selected
  return [...new Set(withInverses)].sort();
}

export function generatePrompts(settings: TrainingSettings): string[] {
  return shuffle(getTrainablePairs(settings));
}

function generateAllPairPrompts(settings: TrainingSettings): string[] {
  const letters = settings.selectedLetters;
  const availableLetters = settings.letterScheme.split('');

  return letters?.map((first) => {
    const bufferIndex = stickerToIndex(settings.buffer, settings.pieceType);
    const firstIndex = settings.letterScheme.indexOf(first);

    const bufferIndices = getIndicesForSharedStickers(bufferIndex, settings.pieceType);
    const firstPieceIndices = settings.includeTwists ? [firstIndex] :
      getIndicesForSharedStickers(firstIndex, settings.pieceType);
    const exclude = bufferIndices.concat(firstPieceIndices);
    const secondLetters = availableLetters.filter((second, index) =>
      !exclude.includes(index)
    );

    return secondLetters.map((second) =>
      `${first}${second}`
    )
  }).flat();
}

export function getInverse3CycleForCurrentPrompt(state: RootState): [number, number, number] | undefined {
  const prompt = selectCurrentPrompt(state);
  const letterScheme = selectLetterScheme(state);
  const bufferIndex = selectBufferIndex(state);

  if (!prompt) {
    return undefined;
  }

  const firstIndex = letterScheme.indexOf(prompt[0]);
  const secondIndex = letterScheme.indexOf(prompt[1]);

  return [bufferIndex, firstIndex, secondIndex];
}

// Type definitions
type PromptState = {
  prompts: string[];
  currentPromptIndex: number;
};

// Initial State
const initialState: PromptState = {
  prompts: [],
  currentPromptIndex: 0,
};

// Selectors
export const selectPrompts = (state: RootState) => state.prompt.prompts;
export const selectCurrentPromptIndex = (state: RootState) => state.prompt.currentPromptIndex;
export const selectCountOfPrompts = (state: RootState) => state.prompt.prompts.length;
export const selectCurrentPrompt = (state: RootState) =>
  selectPrompts(state)[selectCurrentPromptIndex(state)];

// Slice
export const promptSlice = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    resetPrompt: (state, action: PayloadAction<TrainingSettings | undefined>) => {
      if (!action.payload) {
        throw new Error('Settings must be defined to reset prompt');
      }
      state.prompts = generatePrompts(action.payload);
      state.currentPromptIndex = 0;
    },
    goToNextPrompt: (state) => {
      if (state.currentPromptIndex < state.prompts.length) {
        state.currentPromptIndex++;
      }
    },
    goToPreviousPrompt: (state) => {
      if (state.currentPromptIndex > 0) {
        state.currentPromptIndex--;
      }
    },
  },
});

// Actions
export const { resetPrompt, goToNextPrompt, goToPreviousPrompt } = promptSlice.actions;

//Middleware
export const addSettingsToPromptResetMiddleware = (store: any) => (next: any) => (action: any) => {
  if (action.type === resetPrompt.type) {
    action.payload = selectSettingsForCurrentPiece(store.getState());
  }
  next(action);
}

export const setTargetOnPromptChangeMiddleware = (store: any) => (next: any) => (action: any) => {
  next(action);
  if (action.type.startsWith('prompt/')) {
    store.dispatch(setTarget());
  }
}
