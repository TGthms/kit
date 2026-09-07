"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock3, RefreshCw, TimerReset } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedClock } from "@/components/shared/animated-clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  createStopwatch,
  createTimer,
  durationFromHms,
  getStopwatchElapsed,
  getTimerRemaining,
  pauseStopwatch,
  pauseTimer,
  resetStopwatch,
  resetTimer,
  startStopwatch,
  startTimer,
  tickTimer,
  type StopwatchState,
  type TimerState,
} from "@/lib/converter/timer";
import { ToolShell, useToolHistory } from "./shared";
import { text, toolId } from "./everyday-format";

function durationParts(milliseconds: number) {
  const totalCentiseconds = Math.floor(Math.max(0, milliseconds) / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return { hours, minutes, seconds, centiseconds };
}

function formatDuration(milliseconds: number, showHours = true) {
  const { hours, minutes, seconds, centiseconds } = durationParts(milliseconds);
  return `${showHours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function clockParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return { hours, minutes, seconds };
}

function formatClock(milliseconds: number) {
  const { hours, minutes, seconds } = clockParts(milliseconds);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function StopwatchTimer() {
  const t = useTranslations("tools.stopwatch-timer");
  const log = useToolHistory(toolId("stopwatch-timer"));
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [stopwatch, setStopwatch] = useState<StopwatchState>(() => createStopwatch());
  const [timer, setTimer] = useState<TimerState>(() => createTimer(5 * 60 * 1000));
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [now, setNow] = useState(() => Date.now());
  const running = mode === "stopwatch" ? stopwatch.status === "running" : timer.status === "running";
  const duration = durationFromHms(Number(hours), Number(minutes), Number(seconds));
  const fieldsLocked = mode === "timer" && timer.status !== "idle";
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (mode === "timer") setTimer((previous) => tickTimer(previous, current));
    }, 50);
    return () => window.clearInterval(interval);
  }, [mode, running]);
  if (mode === "timer" && timer.status === "idle" && timer.durationMs !== duration) {
    setTimer(createTimer(duration));
  }
  const elapsed = getStopwatchElapsed(stopwatch, now);
  const remaining = getTimerRemaining(timer, now);
  const stopwatchParts = durationParts(elapsed);
  const timerParts = clockParts(remaining);
  const toggle = () => {
    const current = Date.now();
    if (mode === "stopwatch") setStopwatch((previous) => previous.status === "running" ? pauseStopwatch(previous, current) : startStopwatch(previous, current));
    else setTimer((previous) => previous.status === "idle" ? startTimer(createTimer(duration), current) : previous.status === "running" ? pauseTimer(previous, current) : startTimer(previous, current));
  };
  const reset = () => {
    if (mode === "stopwatch") setStopwatch(resetStopwatch());
    else setTimer(resetTimer(duration));
    setNow(Date.now());
  };
  return (
    <ToolShell toolId={toolId("stopwatch-timer")}>
      <SegmentedControl
        value={mode}
        aria-label={`${text(t, "stopwatch", "Stopwatch")} / ${text(t, "countdown", "Countdown")}`}
        onChange={(next) => setMode(next)}
        options={[
          { value: "stopwatch", label: text(t, "stopwatch", "Stopwatch"), icon: TimerReset },
          { value: "timer", label: text(t, "countdown", "Countdown"), icon: Clock3 },
        ]}
      />
      <Card className="overflow-hidden"><CardContent className="flex flex-col items-center gap-6 p-6 sm:p-10">{mode === "stopwatch" ? (
        <AnimatedClock
          hours={stopwatchParts.hours}
          minutes={stopwatchParts.minutes}
          seconds={stopwatchParts.seconds}
          fraction={String(stopwatchParts.centiseconds).padStart(2, "0")}
          label={formatDuration(elapsed)}
          trend={stopwatch.status === "running" ? 1 : 0}
          className="font-mono text-5xl font-semibold tracking-tight sm:text-7xl"
        />
      ) : (
        <AnimatedClock
          hours={timerParts.hours}
          minutes={timerParts.minutes}
          seconds={timerParts.seconds}
          label={formatClock(remaining)}
          trend={timer.status === "running" ? -1 : 0}
          className={`font-mono text-5xl font-semibold tracking-tight sm:text-7xl ${timer.status === "finished" ? "text-destructive" : ""}`}
        />
      )}{mode === "timer" ? <div className="grid w-full max-w-md grid-cols-3 gap-3"><div className="space-y-2"><Label>{text(t, "hours", "Hours")}</Label><Input type="number" min="0" inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} disabled={fieldsLocked} /></div><div className="space-y-2"><Label>{text(t, "minutes", "Minutes")}</Label><Input type="number" min="0" max="59" inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} disabled={fieldsLocked} /></div><div className="space-y-2"><Label>{text(t, "seconds", "Seconds")}</Label><Input type="number" min="0" max="59" inputMode="numeric" value={seconds} onChange={(event) => setSeconds(event.target.value)} disabled={fieldsLocked} /></div></div> : null}<div className="flex flex-wrap justify-center gap-2"><Button size="lg" onClick={toggle}>{running ? text(t, "pause", "Pause") : mode === "timer" && timer.status === "finished" ? text(t, "finished", "Finished") : text(t, "start", "Start")}</Button><Button size="lg" variant="outline" onClick={reset}><RefreshCw /> {text(t, "reset", "Reset")}</Button></div></CardContent></Card>
      {mode === "stopwatch" ? <Button variant="outline" onClick={() => { log(formatDuration(elapsed), "success"); notifyHistorySaved(text(t, "saved", "Time saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved.")); }}><Check /> {text(t, "recordTime", "Record time")}</Button> : null}
    </ToolShell>
  );
}
