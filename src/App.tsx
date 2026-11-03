import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faGear } from '@fortawesome/free-solid-svg-icons';

import ConnectionStatusButton from './components/connection-status';
import Settings from './components/settings';
import PairsPage from './components/pairs';
import TrainerPage from './components/trainer';
import NotConnectedMessage from './components/not-connected-message';

import './lib/cube/cube';
import { useAppSelector } from './state/hooks';
import { selectIsConnected } from './state/connection.duck';
import { Footer } from './components/footer';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showPairs, setShowPairs] = useState(false);
  const isConnected = useAppSelector(selectIsConnected);

  const closeSettings = () => setShowSettings(false);
  const closePairs = () => setShowPairs(false);

  return <>
    <div className="header">
      <ConnectionStatusButton />

      <button
        className='btn btn-default'
        onClick={() => { setShowPairs(!showPairs); setShowSettings(false); }}
      >
        <FontAwesomeIcon icon={faBook} />
      </button>

      <button
        className='btn btn-default'
        onClick={() => { setShowSettings(!showSettings); setShowPairs(false); }}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>
    </div>

    <div className="container">
      {showSettings ? <Settings closeSettings={closeSettings} /> : null}
      {showPairs ? <PairsPage closePairs={closePairs} /> : null}
      {!isConnected && !showSettings && !showPairs ? <NotConnectedMessage /> : null}
      {isConnected && !showSettings && !showPairs ? <TrainerPage /> : null}
    </div>

    <Footer />
  </>

}
