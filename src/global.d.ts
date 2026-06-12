declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

// Allow JSX intrinsic elements when using React 18+ with automatic runtime
import * as React from 'react';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
