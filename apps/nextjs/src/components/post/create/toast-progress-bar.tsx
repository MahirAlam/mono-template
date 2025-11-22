"use client";

import { Progress } from "~/components/ui/progress";

interface ToastProgressBarProps {
  progress: number;
  task: string;
}

const ToastProgressBar = ({ progress, task }: ToastProgressBarProps) => {
  return (
    <div className="w-full space-y-2">
      <p className="text-foreground text-sm font-medium">{task}</p>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default ToastProgressBar;
