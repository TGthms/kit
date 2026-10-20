"use client";

import { Component, type ReactNode } from "react";

/** A failed optional chunk must never take a form or its settings down. */
export class GlassBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
