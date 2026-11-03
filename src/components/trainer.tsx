import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../state/hooks';

import Timer from './timer';
import { resetPrompt, selectCurrentPrompt } from '../state/prompt.duck';
import { selectSelectedPieceType } from '../state/settings.duck';
import { selectPairMemo } from '../state/pairs.duck';
import Prompt from './prompt';
import Moves from './moves';
import { endTraining, selectTrainerActive, selectTrainerMode, startTraining, TrainerMode } from '../state/trainer.duck';
import Summary from './summary';
import ProgressBar from './progress-bar';

import './trainer.less';

export default function TrainerPage() {
  const dispatch = useAppDispatch();

  const isActive = useAppSelector(selectTrainerActive);

  useEffect(() => {
    dispatch(resetPrompt());
  });

  const isPractice = useAppSelector(selectTrainerMode) === 'practice';

  return <div className='trainer-page'>
    {isActive ?
      <>
        {isPractice ?
          <div className='practice-view'>
            <PracticeMemo />
            <Timer />
            <Moves />
            <StopButton />
          </div>
        :
          <>
            <ProgressBar />
            <Prompt />
            <AlgorithmHint />
            <Timer />
            <Moves />
            <StopButton />
          </>
        }
      </>
    :
      <>
        <ActivateButton />
        <Instructions />
        <Summary />
      </>

    }
  </div>
}

function ActivateButton() {
  const Ref: any = useRef(null);
  const modeRef: any = useRef('timeAttack');

  const dispatch = useAppDispatch();

  const COUNTDOWN_START_TIME = 3;

  const [showCountdown, setShowCountDown] = useState(false);
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [time, setTime] = useState(COUNTDOWN_START_TIME);

  const startCountDown = async (mode: TrainerMode) => {
    if (isLoadingFont) return;
    modeRef.current = mode;
    setIsLoadingFont(true);
    try {
      await document.fonts.load('1em Digital', '0123456789');
    } catch (error) {
      // Keep training available if the font cannot be downloaded.
      console.warn('Could not load the timer font', error);
    }
    setIsLoadingFont(false);
    console.log('startCountDown');

    setTime(COUNTDOWN_START_TIME);
    setShowCountDown(true);
    Ref.current = setInterval(timeoutCallback, 700);
  }

  const endCountDown = () => {
    console.log('endCountDown');

    if (Ref.current) clearInterval(Ref.current);
    setShowCountDown(false);
    dispatch(startTraining(modeRef.current));
  }

  const timeoutCallback = () => {
    setTime((prevTime) => prevTime - 1);
  }

  useEffect(() => {
    if (showCountdown && time <= 0) {
      endCountDown();
    }
  }, [showCountdown, time]);

  return <div className='start-button-container'>
    {showCountdown ?
      <div className='countdown'>{time}</div>
    :
      <>
        <button
          className='btn btn-primary btn-large'
          onClick={() => startCountDown('timeAttack')}
          disabled={isLoadingFont}
        >{isLoadingFont ? 'Loading…' : 'Time attack'}</button>
        <button
          className='btn btn-default btn-large'
          onClick={() => startCountDown('practice')}
          disabled={isLoadingFont}
        >Practice</button>
      </>
    }
  </div>
}

function AlgorithmHint() {
  const prompt = useAppSelector(selectCurrentPrompt);
  const pieceType = useAppSelector(selectSelectedPieceType);
  const memo = useAppSelector((state) => selectPairMemo(state, pieceType, prompt ?? ''));

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [prompt]);

  if (!prompt) {
    return null;
  }

  const prefix = memo.word ? `${memo.word}: ` : '';

  return <div className='algorithm-hint'>
    {revealed ?
      <p>{prefix}{memo.algorithm || 'No algorithm saved for this pair'}</p>
    :
      <button
        className='btn btn-default'
        onClick={() => setRevealed(true)}
      >Show algorithm</button>
    }
  </div>;
}

// Practice mode shows the current pair together with its saved word so the
// memo can be learned; the algorithm is only revealed on demand.
function PracticeMemo() {
  const prompt = useAppSelector(selectCurrentPrompt);

  if (!prompt) {
    return null;
  }

  return <div className='practice-memo'>
    <Prompt />
    <PracticeWord pair={prompt} />
    <AlgorithmHint />
  </div>;
}

function PracticeWord({ pair }: { pair: string }) {
  const pieceType = useAppSelector(selectSelectedPieceType);
  const memo = useAppSelector((state) => selectPairMemo(state, pieceType, pair));

  return <p className='practice-word'>{memo.word || 'No word saved'}</p>;
}

function Instructions() {
  return <div className='instructions'>
    <p> U U' &times; 3 &nbsp;&nbsp; to skip to the next prompt. </p>
    <p> R R' &times; 3 &nbsp;&nbsp; to redo to the previous prompt. </p>
    <p> L L' &times; 3 &nbsp;&nbsp; to end the session. </p>
  </div>
}

function StopButton() {
  const dispatch = useAppDispatch();

  const stopTraining = () => {
    dispatch(endTraining());
  }

  return <div className='stop-button-container'>
    <button
      className='btn btn-danger'
      onClick={stopTraining}
    >End</button>
  </div>
}
