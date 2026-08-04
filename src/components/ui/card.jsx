import * as React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={
        "one-card rounded-2xl border border-slate-200 bg-white shadow-sm " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div
      className={
        "one-card-header px-4 pb-2 pt-3 border-b border-slate-100 flex items-center gap-2 " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3
      className={
        "one-card-title text-lg font-semibold tracking-tight " + className
      }
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div
      className={
        "px-4 pb-4 pt-3 text-slate-700 leading-relaxed " + className
      }
      {...props}
    >
      {children}
    </div>
  );
}
