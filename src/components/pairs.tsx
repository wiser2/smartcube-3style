import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { PieceType } from '../lib/cube/cube';

import {
  getAvailablePieceTypes,
  selectSelectedPieceType,
  selectSettingsForCurrentPiece,
  setSelectedPieceType
} from '../state/settings.duck';
import { getAllSelectablePairs } from '../state/prompt.duck';
import { getInverseAlgorithm, selectPairMemo, setPairAlgorithm, setPairCopyToInverse, setPairWord } from '../state/pairs.duck';

import './pairs.less';

type PairGroup = {
  firstLetter: string;
  pairs: string[];
};

export default function PairsPage({ closePairs }) {
  const dispatch = useAppDispatch();

  const pieceType = useAppSelector(selectSelectedPieceType);
  const settings = useAppSelector(selectSettingsForCurrentPiece);
  const pairs = getAllSelectablePairs(settings);
  const groups = getPairsByFirstLetter(pairs);

  const [expandedLetters, setExpandedLetters] = useState<string[]>([]);

  const toggleGroup = (firstLetter: string) => {
    setExpandedLetters((previous) => previous.includes(firstLetter)
      ? previous.filter((letter) => letter !== firstLetter)
      : [...previous, firstLetter]);
  };

  return <>
    <div className="container">
      <h1>Pair memo</h1>
    </div>

    <div className="pairs-page">
      <div className="piece-type-selector">
        {getAvailablePieceTypes().map((piece) => {
          return <button
            className={piece === pieceType ? 'btn btn-primary' : 'btn btn-default'}
            key={piece}
            onClick={() => dispatch(setSelectedPieceType(piece))}
          >{piece}</button>
        })}
      </div>

      {pairs.length === 0 ?
        <p className="pairs-empty">
          No memo pairs are available for this piece type.
        </p>
      :
        <>
        <table className="pair-memo-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Word</th>
              <th>Algorithm</th>
              <th title="Also save the inverse for the reversed pair: commutators [A, B] mirror to [B, A]; move sequences are reversed and inverted (R U R' D' becomes D R U' R'). Applies to both pair directions.">Inverse</th>
            </tr>
          </thead>
          {groups.map(({ firstLetter, pairs }) => {
            const expanded = expandedLetters.includes(firstLetter);
            return <tbody key={firstLetter} className="pair-memo-group">
              <tr className="pair-memo-group-row">
                <td colSpan={4}>
                  <button
                    className={`pair-memo-group-toggle${expanded ? ' pair-memo-group-toggle-expanded' : ''}`}
                    onClick={() => toggleGroup(firstLetter)}
                    aria-expanded={expanded}
                  >{firstLetter}</button>
                </td>
              </tr>
              {expanded && pairs.map((pair) => {
                return <PairMemoRow pieceType={pieceType} pair={pair} key={`${pieceType}-${pair}`} />
              })}
            </tbody>;
          })}
        </table>

        <p className="pair-memo-hint">
          The Inverse box is checked by default and always linked for both pair
          directions: editing one algorithm also fills the reversed pair. Commutators
          like [A, B] mirror to [B, A]; move sequences are reversed and inverted
          (R U R' D' becomes D R U' R').
        </p>
        </>
      }

      <div className="pairs-close-button">
        <button className="btn btn-primary" onClick={closePairs}>Done</button>
      </div>
    </div>
  </>;
}

function getPairsByFirstLetter(pairs: string[]): PairGroup[] {
  const groups = new Map<string, string[]>();
  pairs.forEach((pair) => {
    const group = groups.get(pair[0]) ?? [];
    group.push(pair);
    groups.set(pair[0], group);
  });
  return [...groups.entries()].map(([firstLetter, group]) => ({
    firstLetter,
    pairs: group
  }));
}

function PairMemoRow({ pieceType, pair }: { pieceType: PieceType, pair: string }) {
  const dispatch = useAppDispatch();

  const memo = useAppSelector((state) => selectPairMemo(state, pieceType, pair));
  const hasMemo = memo.word !== '' || memo.algorithm !== '';
  const inversePair = pair.split('').reverse().join('');

  const onAlgorithmChange = (value: string) => {
    dispatch(setPairAlgorithm({ pieceType, pair, value }));
    if (memo.copyToInverse) {
      dispatch(setPairAlgorithm({ pieceType, pair: inversePair, value: getInverseAlgorithm(value) }));
    }
  };

  const onCopyToInverseChange = (value: boolean) => {
    dispatch(setPairCopyToInverse({ pieceType, pair, value }));
    dispatch(setPairCopyToInverse({ pieceType, pair: inversePair, value }));
    if (value && memo.algorithm) {
      dispatch(setPairAlgorithm({ pieceType, pair: inversePair, value: getInverseAlgorithm(memo.algorithm) }));
    }
  };

  return <tr className={`pair-memo-row${hasMemo ? ' pair-memo-row-filled' : ''}`}>
    <td className="pair-memo-cell-pair">{pair}</td>
    <td>
      <input type="text" value={memo.word}
        onChange={(event) => dispatch(setPairWord({ pieceType, pair, value: event.target.value }))} />
    </td>
    <td>
      <input type="text" value={memo.algorithm}
        onChange={(event) => onAlgorithmChange(event.target.value)} />
    </td>
    <td className="pair-memo-cell-inverse">
      <input type="checkbox" checked={memo.copyToInverse ?? true}
        onChange={(event) => onCopyToInverseChange(event.target.checked)} />
    </td>
  </tr>;
}
