import { useCallback, useEffect, useRef, useState } from "react";
import { pickWinMessage } from "@/config/personal";
import { playError, playFlip, playWin } from "@/lib/audio";
import { dateKey } from "@/lib/dates";
import { generatePuzzle } from "@/lib/game/generator";
import { dailySeed } from "@/lib/game/rng";
import { clearSlot, loadSlot, saveSlot, type HistEntry, type PlayPhase, type SavedGame } from "@/lib/game/progress";
import type { ColorName, Difficulty, GameMode, PlayerCell, Puzzle } from "@/lib/game/types";
import { findViolations, isSolved } from "@/lib/game/validator";
import { cloneCell, initialPlayer, toRuleCells } from "@/lib/game/view";
import { recordSolve } from "@/lib/stats";

const STUDY_MS = 5 * 60 * 1000;

export interface Session {
  ready: boolean;
  failed: boolean;
  puzzle: Puzzle | null;
  player: PlayerCell[];
  selected: number | null;
  draftNumber: number | null;
  draftColor: ColorName | null;
  notesMode: boolean;
  draw2Left: number;
  reverseLeft: number;
  moveCount: number;
  elapsedMs: number;
  studyLeftMs: number;
  phase: PlayPhase | "loading";
  winMessage: string;
  violations: number[];
  select: (index: number) => void;
  pickNumber: (n: number) => void;
  pickColor: (color: ColorName) => void;
  erase: () => void;
  undo: () => void;
  reverse: () => void;
  draw2: () => void;
  toggleNotes: () => void;
  newDeal: () => void;
  retry: () => void;
}

function freshSeed(): number {
  const salt = Math.floor(Math.random() * 0x100000000);
  return (Date.now() ^ salt) >>> 0 || 1;
}

export function useSession(
  mode: GameMode,
  difficulty: Difficulty,
  fresh: boolean,
  showConflicts: boolean,
): Session {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [player, setPlayer] = useState<PlayerCell[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [draftNumber, setDraftNumber] = useState<number | null>(null);
  const [draftColor, setDraftColor] = useState<ColorName | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [draw2Left, setDraw2Left] = useState(0);
  const [reverseLeft, setReverseLeft] = useState(2);
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [studyLeftMs, setStudyLeftMs] = useState(STUDY_MS);
  const [phase, setPhase] = useState<PlayPhase | "loading">("loading");
  const [winMessage, setWinMessage] = useState("");
  const [violations, setViolations] = useState<number[]>([]);

  const puzzleRef = useRef<Puzzle | null>(null);
  const playerRef = useRef<PlayerCell[]>([]);
  const historyRef = useRef<HistEntry[]>([]);
  const phaseRef = useRef<PlayPhase | "loading">("loading");
  const draw2Ref = useRef(0);
  const reverseRef = useRef(2);
  const movesRef = useRef(0);
  const elapsedRef = useRef(0);
  const studyRef = useRef(STUDY_MS);
  const recordedRef = useRef(false);
  const winRef = useRef("");
  const notesRef = useRef(false);
  const dateRef = useRef(dateKey());
  const conflictRef = useRef(showConflicts);
  const violationCount = useRef(0);
  const lastStamp = useRef<number | null>(null);
  conflictRef.current = showConflicts;

  const publishViolations = useCallback((nextPlayer: PlayerCell[], nextPuzzle: Puzzle) => {
    const found = findViolations(toRuleCells(nextPuzzle, nextPlayer));
    violationCount.current = found.length;
    const idxs = new Set<number>();
    for (const item of found) for (const cell of item.cells) idxs.add(cell);
    setViolations([...idxs]);
  }, []);

  const persist = useCallback(() => {
    const current = puzzleRef.current;
    const playing = phaseRef.current;
    if (!current || playing === "loading") return;
    const saved: SavedGame = {
      version: 1,
      mode,
      difficulty: current.difficulty,
      dateKey: mode === "daily" ? dateRef.current : null,
      puzzle: current,
      player: playerRef.current,
      history: historyRef.current,
      draw2Left: draw2Ref.current,
      reverseLeft: reverseRef.current,
      moveCount: movesRef.current,
      elapsedMs: elapsedRef.current,
      studyRemainingMs: mode === "study" ? studyRef.current : null,
      phase: playing,
      winMessage: winRef.current,
      recorded: recordedRef.current,
      notesMode: notesRef.current,
    };
    saveSlot(saved);
  }, [mode]);

  const celebrate = useCallback(
    (message?: string) => {
      if (phaseRef.current === "won") return;
      const current = puzzleRef.current;
      if (!current) return;
      const line = message ?? pickWinMessage();
      winRef.current = line;
      setWinMessage(line);
      phaseRef.current = "won";
      setPhase("won");
      if (!recordedRef.current) {
        recordedRef.current = true;
        recordSolve({
          difficulty: current.difficulty,
          elapsedMs: elapsedRef.current,
          mode,
          dateKey: mode === "daily" ? dateRef.current : null,
        });
      }
      playWin();
      persist();
    },
    [mode, persist],
  );

  const adopt = useCallback(
    (nextPuzzle: Puzzle, nextPlayer: PlayerCell[], history: HistEntry[], extras: Partial<SavedGame> & { phase: PlayPhase }) => {
      puzzleRef.current = nextPuzzle;
      playerRef.current = nextPlayer;
      historyRef.current = history;
      phaseRef.current = extras.phase;
      draw2Ref.current = extras.draw2Left ?? nextPuzzle.draw2Max;
      reverseRef.current = extras.reverseLeft ?? nextPuzzle.reverseMax;
      movesRef.current = extras.moveCount ?? 0;
      elapsedRef.current = extras.elapsedMs ?? 0;
      studyRef.current = extras.studyRemainingMs ?? STUDY_MS;
      recordedRef.current = extras.recorded ?? false;
      winRef.current = extras.winMessage ?? "";
      notesRef.current = extras.notesMode ?? false;
      lastStamp.current = extras.phase === "play" ? Date.now() : null;
      setPuzzle(nextPuzzle);
      setPlayer(nextPlayer);
      setDraw2Left(draw2Ref.current);
      setReverseLeft(reverseRef.current);
      setMoveCount(movesRef.current);
      setElapsedMs(elapsedRef.current);
      setStudyLeftMs(studyRef.current);
      setPhase(extras.phase);
      setWinMessage(winRef.current);
      setNotesMode(notesRef.current);
      setSelected(null);
      setDraftNumber(null);
      setDraftColor(null);
      setFailed(false);
      publishViolations(nextPlayer, nextPuzzle);
      setReady(true);
      persist();
    },
    [persist, publishViolations],
  );

  const deal = useCallback(
    (seed: number, diff: Difficulty, sessionDate: string) => {
      try {
        const next = generatePuzzle(seed, diff);
        dateRef.current = sessionDate;
        adopt(next, initialPlayer(next), [], {
          phase: "play",
          draw2Left: next.draw2Max,
          reverseLeft: next.reverseMax,
          moveCount: 0,
          elapsedMs: 0,
          studyRemainingMs: STUDY_MS,
          recorded: false,
          winMessage: "",
          notesMode: false,
        });
      } catch {
        setFailed(true);
        setReady(true);
        phaseRef.current = "loading";
      }
    },
    [adopt],
  );

  useEffect(() => {
    const today = dateKey();
    const saved = loadSlot(mode);
    const matches =
      !!saved &&
      saved.mode === mode &&
      (mode !== "daily" || saved.dateKey === today) &&
      (mode !== "free" || saved.difficulty === difficulty);
    if (saved && matches && !fresh) {
      dateRef.current = saved.dateKey ?? today;
      adopt(saved.puzzle, saved.player.map(cloneCell), saved.history ?? [], saved);
      return;
    }
    const diff: Difficulty = mode === "daily" ? "medium" : mode === "study" ? "easy" : difficulty;
    const seed = mode === "daily" ? dailySeed(today) : freshSeed();
    deal(seed, diff, today);
    // Boot once per visit. Fresh deals ignore a finished or mismatched save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const hidden = document.visibilityState === "hidden";
      const now = Date.now();
      if (!hidden && phaseRef.current === "play" && lastStamp.current != null) {
        const delta = Math.min(1000, Math.max(0, now - lastStamp.current));
        elapsedRef.current += delta;
        setElapsedMs(elapsedRef.current);
        if (mode === "study") {
          studyRef.current = Math.max(0, studyRef.current - delta);
          setStudyLeftMs(studyRef.current);
          if (studyRef.current <= 0) {
            phaseRef.current = "study-end";
            setPhase("study-end");
            lastStamp.current = null;
            persist();
            return;
          }
        }
      }
      lastStamp.current = hidden || phaseRef.current !== "play" ? null : now;
    }, 250);
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        lastStamp.current = null;
        persist();
      } else if (phaseRef.current === "play") {
        lastStamp.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [mode, persist]);

  const applyPlayer = useCallback(
    (next: PlayerCell[], history: HistEntry[], moved: boolean) => {
      playerRef.current = next;
      historyRef.current = history;
      setPlayer(next);
      if (moved) {
        movesRef.current += 1;
        setMoveCount(movesRef.current);
      }
      const current = puzzleRef.current;
      if (!current) return;
      const rules = toRuleCells(current, next);
      const before = violationCount.current;
      publishViolations(next, current);
      if (isSolved(rules)) {
        celebrate();
        return;
      }
      if (moved && conflictRef.current && violationCount.current > before) playError();
      else if (moved) playFlip();
      persist();
    },
    [celebrate, persist, publishViolations],
  );

  const select = useCallback((index: number) => {
    if (phaseRef.current !== "play") return;
    setSelected(index);
    setDraftNumber(null);
    setDraftColor(null);
  }, []);

  const pickNumber = useCallback(
    (n: number) => {
      const current = puzzleRef.current;
      if (!current || selected == null || phaseRef.current !== "play") return;
      const spec = current.cells[selected];
      const cell = playerRef.current[selected];
      if (!spec || !cell || cell.locked) return;
      if (notesRef.current) {
        if (cell.number != null) return;
        const notes = cell.notes.includes(n)
          ? cell.notes.filter((note) => note !== n)
          : [...cell.notes, n].sort((a, b) => a - b);
        const next = playerRef.current.slice();
        next[selected] = { ...cell, notes };
        playerRef.current = next;
        setPlayer(next);
        persist();
        return;
      }
      if (spec.kind === "wild") {
        if (cell.number === n) return;
        const next = playerRef.current.slice();
        next[selected] = { number: n, color: null, notes: [], locked: false };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        return;
      }
      if (spec.kind === "clue" && spec.solutionColor) {
        if (cell.number === n && cell.color === spec.solutionColor) return;
        const next = playerRef.current.slice();
        next[selected] = { number: n, color: spec.solutionColor, notes: [], locked: false };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        setDraftNumber(null);
        setDraftColor(null);
        return;
      }
      const filled = cell.number != null && cell.color != null;
      if (filled && draftNumber == null && draftColor == null) {
        if (cell.number === n) return;
        const next = playerRef.current.slice();
        next[selected] = { ...cell, number: n, notes: [] };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        return;
      }
      const color = draftColor ?? null;
      if (color) {
        const next = playerRef.current.slice();
        next[selected] = { number: n, color, notes: [], locked: false };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        setDraftNumber(null);
        setDraftColor(null);
      } else {
        setDraftNumber(n);
      }
    },
    [applyPlayer, draftColor, draftNumber, persist, selected],
  );

  const pickColor = useCallback(
    (color: ColorName) => {
      const current = puzzleRef.current;
      if (!current || selected == null || phaseRef.current !== "play" || notesRef.current) return;
      const spec = current.cells[selected];
      const cell = playerRef.current[selected];
      if (!spec || !cell || cell.locked) return;
      if (spec.kind === "wild") return;
      if (spec.kind === "clue") {
        if (color !== spec.solutionColor) {
          if (conflictRef.current) playError();
          return;
        }
        if (cell.number == null) {
          setDraftColor(color);
          return;
        }
        return;
      }
      const filled = cell.number != null && cell.color != null;
      if (filled && draftNumber == null && draftColor == null) {
        if (cell.color === color) return;
        const next = playerRef.current.slice();
        next[selected] = { ...cell, color, notes: [] };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        return;
      }
      const number = draftNumber;
      if (number != null) {
        const next = playerRef.current.slice();
        next[selected] = { number, color, notes: [], locked: false };
        applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
        setDraftNumber(null);
        setDraftColor(null);
      } else {
        setDraftColor(color);
      }
    },
    [applyPlayer, draftColor, draftNumber, selected],
  );

  const erase = useCallback(() => {
    if (selected == null || phaseRef.current !== "play") return;
    const cell = playerRef.current[selected];
    if (!cell || cell.locked) return;
    if (cell.number == null && cell.color == null && cell.notes.length === 0) return;
    const next = playerRef.current.slice();
    next[selected] = { number: null, color: null, notes: [], locked: false };
    setDraftNumber(null);
    setDraftColor(null);
    applyPlayer(next, [...historyRef.current, { index: selected, before: cloneCell(cell) }], true);
  }, [applyPlayer, selected]);

  const undo = useCallback(() => {
    if (phaseRef.current !== "play" || historyRef.current.length === 0) return;
    const entry = historyRef.current[historyRef.current.length - 1];
    if (!entry) return;
    const history = historyRef.current.slice(0, -1);
    if (playerRef.current[entry.index]?.locked) {
      historyRef.current = history;
      return;
    }
    const next = playerRef.current.slice();
    next[entry.index] = cloneCell(entry.before);
    setDraftNumber(null);
    setDraftColor(null);
    setSelected(entry.index);
    applyPlayer(next, history, false);
  }, [applyPlayer]);

  const reverse = useCallback(() => {
    if (phaseRef.current !== "play" || reverseRef.current <= 0 || historyRef.current.length === 0) return;
    const steps = Math.min(3, historyRef.current.length);
    const history = historyRef.current.slice();
    const next = playerRef.current.map(cloneCell);
    for (let i = 0; i < steps; i++) {
      const entry = history.pop();
      if (!entry || next[entry.index]?.locked) continue;
      next[entry.index] = cloneCell(entry.before);
    }
    reverseRef.current -= 1;
    setReverseLeft(reverseRef.current);
    setDraftNumber(null);
    setDraftColor(null);
    applyPlayer(next, history, false);
    if (phaseRef.current === "play") playFlip();
  }, [applyPlayer]);

  const draw2 = useCallback(() => {
    const current = puzzleRef.current;
    if (!current || phaseRef.current !== "play" || draw2Ref.current <= 0) return;
    const pool: number[] = [];
    playerRef.current.forEach((cell, index) => {
      const spec = current.cells[index];
      if (!spec || cell.locked || spec.kind === "wild") return;
      if (cell.number != null && cell.color != null) return;
      pool.push(index);
    });
    if (pool.length === 0) return;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = swap;
    }
    const take = new Set(pool.slice(0, Math.min(2, pool.length)));
    const next = playerRef.current.map(cloneCell);
    for (const index of take) {
      const spec = current.cells[index]!;
      next[index] = {
        number: spec.solutionNumber,
        color: spec.solutionColor,
        notes: [],
        locked: true,
      };
    }
    const history = historyRef.current.filter((entry) => !take.has(entry.index));
    draw2Ref.current -= 1;
    setDraw2Left(draw2Ref.current);
    setDraftNumber(null);
    setDraftColor(null);
    applyPlayer(next, history, false);
    if (phaseRef.current === "play") playFlip();
  }, [applyPlayer]);

  const toggleNotes = useCallback(() => {
    if (phaseRef.current !== "play") return;
    notesRef.current = !notesRef.current;
    setNotesMode(notesRef.current);
    setDraftNumber(null);
    setDraftColor(null);
  }, []);

  const newDeal = useCallback(() => {
    if (mode === "daily") return;
    const diff: Difficulty = mode === "study" ? "easy" : difficulty;
    clearSlot(mode);
    deal(freshSeed(), diff, dateKey());
  }, [deal, difficulty, mode]);

  const retry = useCallback(() => {
    const diff: Difficulty = mode === "daily" ? "medium" : mode === "study" ? "easy" : difficulty;
    deal(mode === "daily" ? dailySeed(dateKey()) : freshSeed(), diff, dateKey());
  }, [deal, difficulty, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key >= "1" && event.key <= "6") pickNumber(Number(event.key));
      else if (event.key === "Backspace") erase();
      else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [erase, pickNumber, undo]);

  return {
    ready,
    failed,
    puzzle,
    player,
    selected,
    draftNumber,
    draftColor,
    notesMode,
    draw2Left,
    reverseLeft,
    moveCount,
    elapsedMs,
    studyLeftMs,
    phase,
    winMessage,
    violations: showConflicts ? violations : [],
    select,
    pickNumber,
    pickColor,
    erase,
    undo,
    reverse,
    draw2,
    toggleNotes,
    newDeal,
    retry,
  };
}
