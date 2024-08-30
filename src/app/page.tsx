'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { v4 as uuidv4 } from 'uuid';

interface Roll {
  used: boolean;
  value: number;
  hit: boolean;
}

interface Log {
  id: string;
  player: number;
  isDefender: boolean;
  rolls: Roll[];
}

interface SelectedRoll {
  index: number;
  value: number;
  hit: boolean;
}

interface Ship {
  dice: number[];
  id: string;
  computers: number;
  shields: number;
  priority: number;
  hull: number;
  isDefender?: boolean;
  player?: string;
  damage?: number;
  rolls?: Roll[];
}

export default function Home() {
  const diceSize: number = 6;
  const dice = [
    { id: 1, color: 'yellow' },
    { id: 2, color: 'orange' },
    { id: 3, color: 'red' },
  ];
  const initShip = {
    dice: [],
    id: '',
    computers: 0,
    shields: 0,
    priority: 0,
    hull: 0,
  };
  const [shipData, setShipData] = useState<Ship>(initShip);
  const [battle, setBattle] = useState<Ship[]>([]);

  const roll = (): number => {
    return Math.floor(Math.random() * diceSize) + 1;
  };

  const battleRoll = (ship: Ship) => {
    return ship.dice.map((die) => {
      const rollValue = roll();
      // TODO add hit logic for multiple hit sides
      if (rollValue === diceSize) return { value: 0, hit: true, used: false };
      console.log(rollValue + ship.computers);
      return { value: rollValue + ship.computers, hit: false, used: false };
    });
  };

  const sortShips = (a: Ship, b: Ship) => {
    if (a.priority < b.priority) return 1;
    if (a.priority > b.priority) return -1;
    return 0;
  };

  const [log, updateLog] = useState<any[]>([]);
  const [logStep, updateLogStep] = useState<number>(0);
  const [selectedRoll, updateSelectedRoll] = useState<SelectedRoll | null>();

  const canHit = (roll: Roll, player: string) => {
    if (roll.hit === true) return true;
    return (
      log
        .filter((l) => l.player !== player && l.active)
        .filter((battleLog) => {
          return roll.value - battleLog.shields >= 6;
        }).length > 0
    );
  };

  const allHitsAssigned = (activeLog: Log) => {
    const activeShips = log.filter(
      (l) => l.player !== activeLog.player && l.active
    );
    return activeLog.rolls.filter(
      (r) =>
        r.used !== true &&
        (r.hit === true ||
          activeShips.filter((ship) => r.value - ship.shields >= 6).length > 0)
    ).length;
  };

  const handleInput = (e: any) => {
    const fieldName = e.target.name;
    const fieldValue =
      e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setShipData({ ...shipData, [fieldName]: fieldValue });
  };

  const handleDiceInput = (e: any) => {
    // add dice to ship dice array where the name matches the dice color
    const whichDice = dice.find((d) => d.color === e.target.name);
    if (whichDice) {
      // Remove existing dice that match the id
      shipData.dice = shipData.dice.filter((id) => id !== whichDice.id);
      for (let i = 0; i < e.target.value; i++) {
        shipData.dice.push(whichDice.id);
      }
      setShipData({ ...shipData });
    }
  };

  const addShip = (e: any) => {
    battle.push({
      ...shipData,
      id: uuidv4(),
      isDefender: false,
      damage: 0,
      rolls: [],
    });
    console.log(battle);
    setBattle([...battle]);
  };

  return (
    <main className={styles.main}>
      <div>Build Army</div>
      <select name='player' onChange={handleInput}>
        <option>Don</option>
        <option>Amanda</option>
      </select>
      <div style={{ display: 'flex' }}>
        <input
          type='number'
          name='yellow'
          placeholder='Yellow Dice'
          onChange={handleDiceInput}
        />
        <input
          type='number'
          name='orange'
          placeholder='Orange Dice'
          onChange={handleDiceInput}
        />
        <input
          type='number'
          name='red'
          placeholder='Red Dice'
          onChange={handleDiceInput}
        />
      </div>
      <div style={{ display: 'flex' }}>
        <input
          type='number'
          name='computers'
          placeholder='Computers'
          onChange={handleInput}
        />
        <input
          type='number'
          name='shields'
          placeholder='Shields'
          onChange={handleInput}
        />
        <input
          type='number'
          name='hull'
          placeholder='Hull'
          onChange={handleInput}
        />
        <input
          type='number'
          name='priority'
          placeholder='Priority'
          onChange={handleInput}
        />
      </div>
      <button onClick={addShip}>Add Ship</button>
      <div>Army List</div>
      <div>
        {battle.map((ship, index) => (
          <div key={index}>Ship: {JSON.stringify(ship)}</div>
        ))}
      </div>
      <button
        onClick={() => {
          battle.forEach((b) => {
            b.rolls = battleRoll(b);
          });
          updateLog(
            battle
              .sort(sortShips)
              .map((b) => ({ ...b, active: true, used: false }))
          );
        }}
      >
        Commence!
      </button>
      <div>
        BATTLE
        {log.length > 0 && (
          <div key={`${log[logStep].id}-${log[logStep].player}`}>
            <div>
              Player {log[logStep].player}{' '}
              {log[logStep].isDefender ? 'defender' : 'attacker'}{' '}
            </div>
            <div>
              {log[logStep].rolls.map((r: Roll, idx: number) => (
                <button
                  disabled={r.used || !canHit(r, log[logStep].player)}
                  key={idx}
                  onClick={() =>
                    updateSelectedRoll({
                      index: idx,
                      value: r.value,
                      hit: r.hit,
                    })
                  }
                >
                  {r.hit === true ? 'hit' : r.value} - {JSON.stringify(r.used)}
                </button>
              ))}
            </div>
            <div>
              {log
                .filter((l) => l.player !== log[logStep].player)
                .map((l, battleIdx) => (
                  <div>
                    <button
                      disabled={
                        !(
                          selectedRoll &&
                          (selectedRoll.hit === true ||
                            selectedRoll.value - l.shields >= 6) &&
                          l.active
                        )
                      }
                      onClick={() => {
                        const dmgIndex = log.findIndex(
                          (dmg) => dmg.id === l.id
                        );

                        if (selectedRoll?.index !== undefined) {
                          log[logStep].rolls[selectedRoll.index].used = true;
                        }

                        log[dmgIndex].damage += 1;
                        if (log[dmgIndex].damage >= log[dmgIndex].hull) {
                          log[dmgIndex].active = false;
                        }

                        updateLog([...log]);
                        updateSelectedRoll(null);
                      }}
                      key={`${l.id}-${l.player}-${battleIdx}`}
                    >
                      damage: {l.damage} - shields: {l.shields} - hull: {l.hull}{' '}
                      - active: {JSON.stringify(l.active)}
                    </button>
                  </div>
                ))}
            </div>
            {JSON.stringify(allHitsAssigned(log[logStep]))}
            {logStep < log.length - 1 &&
              allHitsAssigned(log[logStep]) === 0 && (
                <button
                  disabled={log.filter((l) => l.active).length === 0}
                  onClick={() => {
                    updateLogStep(logStep + 1);
                    updateSelectedRoll(null);
                  }}
                >
                  Next Log
                </button>
              )}
            {logStep === log.length - 1 &&
              allHitsAssigned(log[logStep]) === 0 && (
                <button
                  onClick={() => {
                    // reroll ship dice
                    log.forEach((l) => {
                      if (l.active) {
                        l.rolls = battleRoll(l);
                      }
                    });

                    updateLog([...log.filter((f) => f.active)].sort(sortShips));
                    updateLogStep(0);
                  }}
                >
                  Next Round
                </button>
              )}
            <button
              onClick={() => {
                updateLog(
                  battle
                    .sort(sortShips)
                    .map((b) => ({ ...b, active: true, used: false }))
                );
                updateLogStep(0);
              }}
            >
              Reroll
            </button>
          </div>
        )}
        {JSON.stringify(log)}
      </div>
    </main>
  );
}
