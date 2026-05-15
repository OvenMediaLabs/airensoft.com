import React, {type ComponentProps, type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Wrap every markdown `<table>` in a scrollable `<div>` so iOS Safari
 * touch-swipes engage horizontal scrolling.
 *
 * iOS Safari historically does NOT treat a `<table>` with
 * `display: block; overflow-x: auto` as a touch-scrollable container —
 * the table layout algorithm intercepts touches for cell selection
 * and swipes don't translate into scroll. A plain `<div>` wrapper
 * with `overflow-x: auto` is the standard pattern that works reliably
 * across desktop browsers, Android Chrome, and iOS Safari.
 */
export default function MarkdownTable(
  props: ComponentProps<'table'>,
): ReactNode {
  return (
    <div className={styles.wrapper}>
      <table {...props} />
    </div>
  );
}
