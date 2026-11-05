import React from "react";

import { useAppSelector } from "../state/hooks";
import { selectTrainerMode, selectTrainerResults } from "../state/trainer.duck";
import { Move, simplifyAlg } from "../lib/cube/cube";

import './summary.less';

export default function Summary() {
  const mode = useAppSelector(selectTrainerMode);
  const results = useAppSelector(selectTrainerResults);
  let sortedResults = [...results].sort((a, b) => (b.time || Infinity) - (a.time || Infinity));

  return <div className="summary">
    <CaseTimesBoxPlot mode={mode} results={results} />
    <CaseTimesColumnChart mode={mode} results={results} />
    {results.length > 0 ?
      <>
        <table>
          <thead>
            <tr>
              <th>Prompt</th>
              <th>Total time</th>
              <th>Recognition time</th>
              <th>Execution time</th>
              <th>Algorithm</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => <tr key={result.prompt}>
              <td>{result.prompt}</td>
              <td>{result.time ? formatTime(result.time) : "skipped"}</td>
              <td>{result.recognitionTime ? formatTime(result.recognitionTime) : "--"}</td>
              <td>{formatTime(calcExecTime(result.time, result.recognitionTime))}</td>
              <td>{simplifyAlg(result.moves.map(move => new Move(move.move))).join(" ")}</td>
            </tr>)}
          </tbody>
        </table>
        <br/>
      </>
    : null}
  </div>
}

// A time attack session solves each case once. Draw a column chart of the
// completion time per case, slowest to fastest, so slow cases stand out.
function CaseTimesColumnChart({ mode, results }) {
  if (mode !== 'timeAttack') {
    return null;
  }

  if (results.length === 0) {
    return null;
  }

  const cases = [...results].sort((a, b) => (b.time || Infinity) - (a.time || Infinity));
  const max = Math.max(...cases.map((result) => result.time || 0));

  return <div className="case-times-column-chart">
    <h2>Case times</h2>
    <div className="column-chart">
      {cases.map((result) => {
        const isSkipped = !result.time;
        const percent = isSkipped ? 2 : Math.max((result.time / max) * 100, 2);

        return <div className="column-chart-column" key={result.prompt}>
          <span className="column-chart-bar-area">
            <span
              className={`column-chart-bar${isSkipped ? ' skipped' : ''}`}
              style={{ height: `${percent}%` }}
            />
            <span className="column-chart-tooltip">
              <span className="column-chart-prompt"><b>{result.prompt}</b></span>
              <span className="column-chart-stat">total <b>{result.time ? formatTime(result.time) : "skipped"}</b></span>
              <span className="column-chart-stat">recognition <b>{result.recognitionTime ? formatTime(result.recognitionTime) : "--"}</b></span>
              <span className="column-chart-stat">execution <b>{formatTime(calcExecTime(result.time, result.recognitionTime))}</b></span>
            </span>
          </span>
          <span className="column-chart-label" title={result.prompt}>{result.prompt}</span>
          <span className="column-chart-time">{isSkipped ? 'skip' : formatTime(result.time)}</span>
        </div>;
      })}
    </div>
  </div>;
}

// After a practice session, each case has been seen any number of times. Show a
// box-and-whisker plot of the solve times per case so slow cases stand out.
function CaseTimesBoxPlot({ mode, results }) {
  if (mode !== 'practice') {
    return null;
  }

  const timesByCase = new Map();
  const skipsByCase = new Map();
  results.forEach((result) => {
    if (result.time) {
      const times = timesByCase.get(result.prompt) ?? [];
      times.push(result.time);
      timesByCase.set(result.prompt, times);
    } else {
      skipsByCase.set(result.prompt, (skipsByCase.get(result.prompt) ?? 0) + 1);
    }
  });

  const boxes = [...timesByCase.entries()]
    .map(([prompt, times]) => ({
      prompt,
      ...boxStats(times),
      skips: skipsByCase.get(prompt) ?? 0,
    }))
    .sort((a, b) => b.median - a.median);

  if (boxes.length === 0) {
    return null;
  }
  const max = Math.max(...boxes.map((box) => box.max));

  return <div className="case-times-box-plot">
    <h2>Case times</h2>
    {boxes.map((box) => <BoxPlotRow box={box} max={max} key={box.prompt} />)}
  </div>;
}

function BoxPlotRow({ box, max }) {
  const percent = (time: number) => `${(time / max) * 100}%`;

  return <div className="box-plot-row">
    <span className="box-plot-label">{box.prompt}</span>
    <span className="box-plot-skips">
      {box.skips > 0 ? `${box.skips} skip${box.skips > 1 ? 's' : ''}` : ''}
    </span>
    <span className="box-plot-track">
      <span
        className="box-plot-whisker"
        style={{ left: percent(box.min), width: percent(box.max - box.min) }}
      />
      <span
        className="box-plot-box"
        style={{ left: percent(box.q1), width: percent(box.q3 - box.q1) }}
      />
      <span className="box-plot-median" style={{ left: percent(box.median) }} />
      <span className="box-plot-tooltip">
        {(["min", "q1", "median", "q3", "max"] as const).map((stat) =>
          <span key={stat} className="box-plot-stat">
            {stat} <b>{formatTime(box[stat])}</b>
          </span>
        )}
      </span>
    </span>
    <span className="box-plot-time">{formatTime(box.median)}</span>
  </div>;
}

function boxStats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
  };
}

function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function calcExecTime(totalTime: number | null, recognitionTime: number | null): number {
  if (!totalTime || !recognitionTime) {
    return 0;
  }
  if (recognitionTime > totalTime) {
    totalTime;
  }
  return totalTime - recognitionTime;
}

function formatTime(time: number): string {
  if (!time || time === Infinity || time < 0) {
    return "--";
  }

  return (time / 1000).toFixed(2);
}