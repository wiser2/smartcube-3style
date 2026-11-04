import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

import { PieceType } from '../lib/cube/cube';

// Type definitions
type PairMemo = {
  word: string;
  algorithm: string;
  copyToInverse?: boolean;
};

type PairsState = {
  corners: Record<string, PairMemo>;
  edges: Record<string, PairMemo>;
};

// Initial State
const defaultPairsState: PairsState = {
  corners: {},
  edges: {},
};

// Merge the saved memos over the defaults so newly added fields stay populated.
const savedPairs = localStorage.getItem('pairs');
const saved = savedPairs ? JSON.parse(savedPairs) : undefined;
const initialState: PairsState = saved ? {
  ...defaultPairsState,
  ...saved,
  corners: saved.corners ?? {},
  edges: saved.edges ?? {},
} : defaultPairsState;

// Selectors
export const selectPairMemo = (state: RootState, pieceType: PieceType, pair: string): PairMemo =>
  state.pairs[pieceType][pair] ?? { word: '', algorithm: '', copyToInverse: true };

// Slice
export const pairsSlice = createSlice({
  name: 'pairs',
  initialState,
  reducers: {
    setPairWord: (state, action: PayloadAction<{ pieceType: PieceType, pair: string, value: string }>) => {
      const { pieceType, pair, value } = action.payload;
      const memo = state[pieceType][pair] ?? { word: '', algorithm: '' };
      memo.word = value;
      state[pieceType][pair] = memo;
    },
    setPairAlgorithm: (state, action: PayloadAction<{ pieceType: PieceType, pair: string, value: string }>) => {
      const { pieceType, pair, value } = action.payload;
      const memo = state[pieceType][pair] ?? { word: '', algorithm: '', copyToInverse: true };
      memo.algorithm = value;
      state[pieceType][pair] = memo;
    },
    setPairCopyToInverse: (state, action: PayloadAction<{ pieceType: PieceType, pair: string, value: boolean }>) => {
      const { pieceType, pair, value } = action.payload;
      const memo = state[pieceType][pair] ?? { word: '', algorithm: '', copyToInverse: true };
      memo.copyToInverse = value;
      state[pieceType][pair] = memo;
    },
  }
});

// Actions
export const {
  setPairWord,
  setPairAlgorithm,
  setPairCopyToInverse,
} = pairsSlice.actions;

// Helper functions
// Returns the algorithm to store for the inverse pair. In commutator notation
// (surrounded by square brackets, e.g. [R U R', D']) the two parts are swapped:
// [A, B] becomes [B, A]. The same applies when setup moves precede the
// commutator (e.g. R' B' R:[R D R',U']): a:[b,c] expands to a [b,c] a', whose
// inverse is a [c,b] a', so the setup moves stay and the parts swap. Any other
// notation is treated as a move sequence and the moves are reversed and
// inverted: R U R' D' becomes D R U' R'.
export function getInverseAlgorithm(algorithm: string): string {
  const trimmed = algorithm.trim();

  const colonIndex = findTopLevelColon(trimmed);
  if (colonIndex >= 0) {
    const setup = trimmed.slice(0, colonIndex).trim();
    const commutator = trimmed.slice(colonIndex + 1).trim();
    if (commutator.startsWith('[') && commutator.endsWith(']')) {
      const swapped = swapCommutatorParts(commutator);
      if (swapped !== null) {
        // Preserve the original spacing after the colon.
        const separator = trimmed[colonIndex + 1] === ' ' ? ': ' : ':';
        return `${setup}${separator}${swapped}`;
      }
    }
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return swapCommutatorParts(trimmed) ?? trimmed;
  }

  return invertMoveSequence(trimmed);
}

function invertMoveSequence(algorithm: string): string {
  const moves = algorithm.match(/[A-Za-z]+(?:'2|'|2)?/g);
  if (!moves) {
    return algorithm;
  }
  return moves.map(invertMove).reverse().join(' ');
}

function invertMove(move: string): string {
  // Half turns (R2, R'2) invert to themselves.
  if (move.endsWith('2')) {
    return move;
  }
  if (move.endsWith("'")) {
    return move.slice(0, -1);
  }
  return move + "'";
}

function findTopLevelComma(text: string): number {
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '[' || character === '(') {
      depth++;
    } else if (character === ']' || character === ')') {
      depth--;
    } else if (character === ',' && depth === 0) {
      return index;
    }
  }
  return -1;
}

// Swaps the two top-level parts of a bracketed commutator ([A, B] becomes
// [B, A]), preserving the original comma spacing. Returns null when the text
// inside the brackets has no top-level comma.
function swapCommutatorParts(commutator: string): string | null {
  const inner = commutator.slice(1, -1);
  const commaIndex = findTopLevelComma(inner);
  if (commaIndex < 0) {
    return null;
  }

  const separator = inner[commaIndex + 1] === ' ' ? ', ' : ',';
  const first = inner.slice(0, commaIndex).trim();
  const second = inner.slice(commaIndex + 1).trim();
  return `[${second}${separator}${first}]`;
}

function findTopLevelColon(text: string): number {
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '[' || character === '(') {
      depth++;
    } else if (character === ']' || character === ')') {
      depth--;
    } else if (character === ':' && depth === 0) {
      return index;
    }
  }
  return -1;
}

// Middleware
export const pairsPersistenceMiddleware = (store: any) => (next: any) => (action: any) => {
  // Save the memos to local storage after every action
  next(action);
  if (action.type.startsWith('pairs/')) {
    localStorage.setItem('pairs', JSON.stringify(store.getState().pairs));
  }
}
