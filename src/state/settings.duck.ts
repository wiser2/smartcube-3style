import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { cornerStickerToIndex, edgeStickerToIndex } from '../lib/cube/cube';

// Constants
const AVAILABLE_BUFFERS = {
  corners: ['UFR', 'UFL', 'UBL', 'UBR', 'DFR', 'DFL', 'DBL', 'DBR'],
  edges: ['UF', 'UL', 'UB', 'UR', 'FL', 'FR', 'DF', 'DL', 'DB', 'DR']
};

// Type definitions
export type TrainingSettings = {
  pieceType: PieceType;
  includeInverses: boolean;
  includeTwists: boolean;
  letterScheme: string;
  buffer: string;
  selectedLetters: string[];
  selectedPairs: string[];
}

type SettingsGroup = {
  corners: TrainingSettings;
  edges: TrainingSettings;
}

export type PieceType = keyof SettingsGroup;

type Settings = {
  selectedPieceType: PieceType;
  settings: SettingsGroup;
}

// Initial State
const defaultSettings: Settings = {
  selectedPieceType: 'corners',
  settings: {
    corners: {
      pieceType: 'corners',
      includeInverses: true,
      includeTwists: false,
      letterScheme: 'ABCDEFGHIJKLMNOPQRSTUVWX',
      buffer: 'UFR',
      selectedLetters: [],
      selectedPairs: []
    },
    edges: {
      pieceType: 'edges',
      includeInverses: true,
      includeTwists: false,
      letterScheme: 'ABCDEFGHIJKLMNOPQRSTUVWX',
      buffer: 'UF',
      selectedLetters: [],
      selectedPairs: []
    }
  },
};

// Merge saved settings over the defaults so newly added fields stay populated.
const savedSettings = localStorage.getItem('settings');
const saved = savedSettings ? JSON.parse(savedSettings) : undefined;
const initialState: Settings = saved ? {
  ...defaultSettings,
  ...saved,
  settings: {
    corners: { ...defaultSettings.settings.corners, ...saved.settings?.corners },
    edges: { ...defaultSettings.settings.edges, ...saved.settings?.edges },
  },
} : defaultSettings;

// Selectors
export const selectSettings = (state: RootState) => state.settings;
export const selectSelectedPieceType = (state: RootState) => state.settings.selectedPieceType;
export const selectSettingsForCurrentPiece = (state: RootState) => state.settings.settings[selectSelectedPieceType(state)];
export const selectIncludeInverses = (state: RootState) => selectSettingsForCurrentPiece(state).includeInverses;
export const selectIncludeTwists = (state: RootState) => selectSettingsForCurrentPiece(state).includeTwists;
export const selectLetterScheme = (state: RootState) => selectSettingsForCurrentPiece(state).letterScheme;
export const selectBuffer = (state: RootState) => selectSettingsForCurrentPiece(state).buffer;
export const selectBufferIndex = (state: RootState) => pieceToIndex(selectBuffer(state), selectSelectedPieceType(state));
export const selectSelectedLetters = (state: RootState) => selectSettingsForCurrentPiece(state).selectedLetters;
export const selectSelectedPairs = (state: RootState) => selectSettingsForCurrentPiece(state).selectedPairs;

// Slice
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSelectedPieceType: (state, action: PayloadAction<PieceType>) => {
      state.selectedPieceType = action.payload;
    },
    setSettingsForPiece: (state, action: PayloadAction<TrainingSettings>) => {
      state.settings[state.selectedPieceType] = action.payload;
    },
    setIncludeInverses: (state, action: PayloadAction<boolean>) => {
      const pieceSettings = state.settings[state.selectedPieceType];
      pieceSettings.includeInverses = action.payload;

      // Mirror the current pair selection immediately. Enabling adds the inverse
      // of every selected pair; disabling un-mirrors, keeping one direction of
      // each mutually selected pair.
      const inverseOf = (pair: string) => pair.split('').reverse().join('');
      const selected = pieceSettings.selectedPairs;
      if (action.payload) {
        pieceSettings.selectedPairs =
          [...new Set(selected.concat(selected.map(inverseOf)))].sort();
      } else {
        pieceSettings.selectedPairs = selected.filter((pair) =>
          pair <= inverseOf(pair) || !selected.includes(inverseOf(pair))
        );
      }
    },
    setIncludeTwists: (state, action: PayloadAction<boolean>) => {
      state.settings[state.selectedPieceType].includeTwists = action.payload;
    },
    setLetterScheme: (state, action: PayloadAction<string>) => {
      state.settings[state.selectedPieceType].letterScheme = action.payload;
    },
    setBuffer: (state, action: PayloadAction<string>) => {
      state.settings[state.selectedPieceType].buffer = action.payload;
    },
    setSelectedLetters: (state, action: PayloadAction<string[]>) => {
      state.settings[state.selectedPieceType].selectedLetters = action.payload;
    },
    setSelectedPairs: (state, action: PayloadAction<string[]>) => {
      state.settings[state.selectedPieceType].selectedPairs = action.payload;
    }
  }
});

// Actions
export const {
  setSelectedPieceType,
  setSettingsForPiece,
  setIncludeInverses,
  setIncludeTwists,
  setLetterScheme,
  setBuffer,
  setSelectedLetters,
  setSelectedPairs,
} = settingsSlice.actions;

// Middleware
export const settingsPersistenceMiddleware = (store: any) => (next: any) => (action: any) => {
  // Save the settings to local storage after every action
  next(action);
  if (action.type.startsWith('settings/')) {
    localStorage.setItem('settings', JSON.stringify(store.getState().settings));
  }
}

// Helper functions
export function getAvailableBuffers(piece: PieceType): string[] {
  return AVAILABLE_BUFFERS[piece];
}

export function getAvailablePieceTypes(): (PieceType)[] {
  return Object.keys(AVAILABLE_BUFFERS) as PieceType[];
}

function pieceToIndex(piece: string, pieceType: PieceType): number {
  switch (pieceType) {
    case 'corners':
      return cornerStickerToIndex(piece);
    case 'edges':
      return edgeStickerToIndex(piece);
    default:
      throw new Error('Invalid piece type');
  }
}
