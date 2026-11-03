import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import {
  PieceType,
  getAvailableBuffers,
  getAvailablePieceTypes,
  selectBuffer,
  selectIncludeInverses,
  selectIncludeTwists,
  selectLetterScheme,
  selectSelectedPairs,
  selectSelectedPieceType,
  setBuffer,
  setIncludeInverses,
  setIncludeTwists,
  setLetterScheme,
  setSelectedLetters,
  setSelectedPairs,
  setSelectedPieceType
} from '../state/settings.duck';

import './settings.less';
import {faYoutube} from "@fortawesome/free-brands-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faInfo, faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import {getIndicesForSharedStickers, stickerToIndex} from "../lib/cube/cube";

export default function Settings({ closeSettings }) {
  return <>
    <div className="container">
      <h1>Settings</h1>
    </div>

    <div className="settings-page">
      <PieceTypeSelector />
      {/* <IncludeTwists /> */}
      <LetterScheme />
      <BufferSettings />
      <IncludeInverses />
      <PairMatrix />
      <div className='settings-close-button'>
        <button className='btn btn-primary'
          onClick={closeSettings}>Done</button>

      </div>
    </div>
  </>
}

function PieceTypeSelector() {
  const dispatch = useAppDispatch();

  const pieceType = useAppSelector(selectSelectedPieceType);
  const availablePieceTypes = getAvailablePieceTypes();

  const onChange = (piece: PieceType) => {
    dispatch(setSelectedPieceType(piece));
  }

  return <div className="piece-type-selector">
    {availablePieceTypes.map((piece) => {
      return <button
          className={piece === pieceType ? 'btn btn-primary' : 'btn btn-default'}
          key={piece}
          onClick={() => onChange(piece)}
        >
          {piece}
        </button>
    })}
  </div>;
}

function IncludeInverses() {
  const dispatch = useAppDispatch();

  const includeInverses = useAppSelector(selectIncludeInverses);

  const onUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setIncludeInverses(event.target.checked));
  }

  return <div className="include-inverses">
    <label>
      <input type="checkbox" onChange={onUpdate} checked={includeInverses} />
      Include inverses
    </label>
  </div>;
}

function IncludeTwists() {
  const dispatch = useAppDispatch();

  const includeTwists = useAppSelector(selectIncludeTwists);

  const onUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setIncludeTwists(event.target.checked));
  }

  return <div className="include-twists">
    <label>
      <input type="checkbox" onChange={onUpdate} checked={includeTwists} />
      Include twists
    </label>
  </div>;
}

function BufferSettings() {
  const dispatch = useAppDispatch();

  const pieceType = useAppSelector(selectSelectedPieceType);
  const buffer = useAppSelector(selectBuffer);
  const availableBuffers = getAvailableBuffers(pieceType);

  const onUpdate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSelectedLetters([]));
    dispatch(setSelectedPairs([]));
    dispatch(setBuffer(event.target.value));
  }

  return <div className="buffer-settings">
    <label>
      Buffer
      <select onChange={onUpdate} value={buffer}>
        {availableBuffers.map((option) => {
          return <option key={option} value={option}>{option}</option>
        })}
      </select>
    </label>
  </div>;
}

function LetterScheme() {
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');

  const letterScheme = useAppSelector(selectLetterScheme);

  const onUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length !== 24 || /\s/.test(value)) {
      setError('Input must contain exactly 24 printable characters and no whitespace.');
      dispatch(setLetterScheme(value));
    } else {
      setError('');
      dispatch(setLetterScheme(value));
    }
  }

  return <div className="letter-scheme">
    <label>
      Letter scheme
      <input type="text" onChange={onUpdate} value={letterScheme} />
      <div className="settings-hint">
        <FontAwesomeIcon icon={faInfoCircle} />Alphabetical order follows Speffz
      </div>
    </label>
    {error && <p className="error">{error}</p>}
  </div>;
}

function PairMatrix() {
  const dispatch = useAppDispatch();

  const letterScheme = useAppSelector(selectLetterScheme);
  const pieceType = useAppSelector(selectSelectedPieceType);
  const buffer = useAppSelector(selectBuffer);
  const includeTwists = useAppSelector(selectIncludeTwists);
  const includeInverses = useAppSelector(selectIncludeInverses);
  const selectedPairs = useAppSelector(selectSelectedPairs);

  const bufferIndex = stickerToIndex(buffer, pieceType);
  const bufferIndices = getIndicesForSharedStickers(bufferIndex, pieceType);
  const letters = letterScheme.split('').filter((_, index) =>
    !bufferIndices.includes(index)
  );

  const isSelectable = (first: string, second: string) => {
    if (first === second) {
      return false;
    }
    if (!includeTwists) {
      const firstIndex = letterScheme.indexOf(first);
      const secondIndex = letterScheme.indexOf(second);
      if (getIndicesForSharedStickers(firstIndex, pieceType).includes(secondIndex)) {
        return false;
      }
    }
    return true;
  };

  const inverseOf = (pair: string) => pair.split('').reverse().join('');

  const toggle = (first: string, second: string) => {
    toggleGroup([first + second]);
  };

  // Selecting a header letter selects the whole row (pairs starting with that
  // letter) or column (pairs ending with that letter).
  const rowPairs = (row: string) =>
    letters.filter((column) => isSelectable(row, column)).map((column) => row + column);
  const columnPairs = (column: string) =>
    letters.filter((row) => isSelectable(row, column)).map((row) => row + column);

  const invertGroup = (pairs: string[]) =>
    includeInverses
      ? [...new Set(pairs.flatMap((pair) => [pair, inverseOf(pair)]))]
      : pairs;

  const allSelected = (pairs: string[]) =>
    pairs.length > 0 && pairs.every((pair) => selectedPairs.includes(pair));

  const toggleGroup = (pairs: string[]) => {
    const group = invertGroup(pairs);
    const next = allSelected(group)
      ? selectedPairs.filter((pair) => !group.includes(pair))
      : [...new Set([...selectedPairs, ...group])].sort();
    dispatch(setSelectedPairs(next));
  };

  return <div className="pair-matrix">
    <label>
      Selected pairs
    </label>
    <div className="settings-hint">
      <FontAwesomeIcon icon={faInfoCircle} />
      <span>
        Toggle specific letter pairs to train (row = first letter, column = second).
        Click a letter to select its whole row or column. Without twists, pairs on
        the same piece are unavailable. With inverses on, a pair selects its
        reverse too.
      </span>
    </div>
    <button
      className='btn btn-default pair-matrix-clear'
      onClick={() => dispatch(setSelectedPairs(letters.flatMap((row) => rowPairs(row))))}
    >Select all</button>
    <button
      className='btn btn-default pair-matrix-clear'
      onClick={() => dispatch(setSelectedPairs([]))}
      disabled={selectedPairs.length === 0}
    >Clear pairs</button>
    <div className="pair-matrix-grid" style={{ gridTemplateColumns: `repeat(${letters.length + 1}, minmax(0, 1fr))` }}>
      <div className="pair-matrix-header" />
      {letters.map((letter) =>
        <button
          className={`pair-matrix-header${allSelected(columnPairs(letter)) ? ' pair-matrix-header-selected' : ''}`}
          key={`column-${letter}`}
          onClick={() => toggleGroup(columnPairs(letter))}
        >{letter}</button>
      )}
      {letters.map((rowLetter) => [
        <button
          className={`pair-matrix-header${allSelected(rowPairs(rowLetter)) ? ' pair-matrix-header-selected' : ''}`}
          key={`row-${rowLetter}`}
          onClick={() => toggleGroup(rowPairs(rowLetter))}
        >{rowLetter}</button>,
        ...letters.map((columnLetter) => {
          const pair = rowLetter + columnLetter;
          const selected = selectedPairs.includes(pair);
          const selectable = isSelectable(rowLetter, columnLetter);
          return <button
            key={pair}
            className={`pair-matrix-cell${selected ? ' pair-matrix-cell-selected' : ''}`}
            disabled={!selectable}
            onClick={() => toggle(rowLetter, columnLetter)}
            aria-label={pair}
          />;
        })
      ])}
    </div>
  </div>;
}

