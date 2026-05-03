/*
  Organic flowing background — inspired by B.AI's paper-fold / fluid wave aesthetic.
  Pure CSS + SVG, no canvas, no JS animation loops.
*/
import React from 'react';

export default function OrganicBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Large flowing blob — top right */}
      <svg
        viewBox='0 0 900 600'
        xmlns='http://www.w3.org/2000/svg'
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '70%',
          opacity: 'var(--lr-blob-1, 0.18)',
          animation: 'organicDrift1 18s ease-in-out infinite alternate',
        }}
      >
        <path
          d='M720,60 C820,100 880,220 860,340 C840,460 740,540 620,560 C500,580 380,520 300,420 C220,320 220,180 320,100 C420,20 620,20 720,60 Z'
          fill='var(--lr-fg)'
        />
      </svg>

      {/* Medium blob — bottom left */}
      <svg
        viewBox='0 0 700 500'
        xmlns='http://www.w3.org/2000/svg'
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-8%',
          width: '55%',
          opacity: 'var(--lr-blob-2, 0.10)',
          animation: 'organicDrift2 22s ease-in-out infinite alternate',
        }}
      >
        <path
          d='M560,80 C660,140 700,280 660,380 C620,480 500,520 380,500 C260,480 160,400 120,300 C80,200 120,80 220,40 C320,0 460,20 560,80 Z'
          fill='var(--lr-fg)'
        />
      </svg>

      {/* Thin folded-paper line — horizontal */}
      <svg
        viewBox='0 0 1440 200'
        xmlns='http://www.w3.org/2000/svg'
        preserveAspectRatio='none'
        style={{
          position: 'absolute',
          bottom: '20%',
          left: 0,
          width: '100%',
          opacity: 'var(--lr-blob-3, 0.06)',
        }}
      >
        <path
          d='M0,100 C180,40 360,160 540,100 C720,40 900,160 1080,100 C1260,40 1380,120 1440,100'
          fill='none'
          stroke='var(--lr-fg)'
          strokeWidth='1.5'
        />
        <path
          d='M0,130 C200,70 400,180 600,120 C800,60 1000,170 1200,110 C1320,80 1400,140 1440,130'
          fill='none'
          stroke='var(--lr-fg)'
          strokeWidth='0.8'
        />
      </svg>

      <style>{`
        @keyframes organicDrift1 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(-30px, 20px) scale(1.04); }
        }
        @keyframes organicDrift2 {
          0%   { transform: translate(0,0) scale(1) rotate(-2deg); }
          100% { transform: translate(20px,-25px) scale(1.06) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
