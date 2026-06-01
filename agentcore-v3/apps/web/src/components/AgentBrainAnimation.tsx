'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Filter, HelpCircle, UserPlus, AlertTriangle, Brain } from 'lucide-react';

interface AgentBrainAnimationProps {
  agentName: string;
  isVisible: boolean;
  onComplete: () => void;
}

interface NodeConfig {
  id: string;
  x: number;
  y: number;
  icon: React.ElementType;
}

const NODES: NodeConfig[] = [
  { id: 'greeting', x: 150, y: 30, icon: MessageCircle },
  { id: 'qualification', x: 255, y: 85, icon: Filter },
  { id: 'faq', x: 265, y: 165, icon: HelpCircle },
  { id: 'leadCapture', x: 255, y: 245, icon: UserPlus },
  { id: 'escalation', x: 150, y: 280, icon: AlertTriangle },
  { id: 'memory', x: 35, y: 245, icon: Brain },
];

const NODE_SIZE = 36;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 310;
const CENTER = { x: 150, y: 155 };

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
];

const PARTICLE_CONNECTIONS: [number, number][] = [
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 0], [5, 1],
];

function Sparkle({ angle, distance }: { angle: number; distance: number }) {
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;
  const size = 3 + Math.random() * 4;

  return (
    <motion.div
      className="absolute rounded-full bg-mauve-400"
      style={{ width: size, height: size }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
      transition={{ duration: 1.4, delay: 5 + Math.random() * 0.4, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

export default function AgentBrainAnimation({ agentName, isVisible, onComplete }: AgentBrainAnimationProps) {
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!isVisible) {
      setPhase(0);
      completedRef.current = false;
      return;
    }

    setPhase(0);
    completedRef.current = false;

    const t1 = setTimeout(() => setPhase(1), 50);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 3000);
    const t4 = setTimeout(() => setPhase(4), 4500);
    const t5 = setTimeout(handleComplete, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isVisible, handleComplete]);

  if (!isVisible) return null;

  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 50 + Math.random() * 100;
    return <Sparkle key={i} angle={angle} distance={distance} />;
  });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="absolute inset-0 bg-mauve-50/85 backdrop-blur-[4px]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212, 182, 216, 0.6) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div
          className="relative"
          style={{ width: SVG_WIDTH, height: SVG_HEIGHT }}
        >
          <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="absolute inset-0"
          >
            {CONNECTIONS.map(([a, b], i) => (
              <motion.line
                key={`line-${i}`}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                stroke="#A896AB"
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={phase >= 2 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeInOut' }}
              />
            ))}

            {PARTICLE_CONNECTIONS.map(([a, b], i) => {
              const from = NODES[a];
              const to = NODES[b];
              return phase >= 2 ? (
                <motion.circle
                  key={`particle-${i}`}
                  r={2.5}
                  fill="#C5A8CD"
                  initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                  animate={{
                    cx: [from.x, to.x],
                    cy: [from.y, to.y],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 1.8 + i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: 'easeInOut',
                  }}
                />
              ) : null;
            })}

            {phase >= 3 && (
              <>
                <motion.circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={9}
                  fill="#5A4D59"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 1.35, 1],
                    opacity: 1,
                  }}
                  transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.45, 0.7, 1],
                  }}
                  style={{ filter: 'drop-shadow(0 0 14px rgba(90, 77, 89, 0.45))' }}
                />
                <motion.circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={9}
                  fill="none"
                  stroke="#5A4D59"
                  strokeWidth={1.5}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: [1, 2.4, 2.4], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                />
              </>
            )}
          </svg>

          {NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.div
                key={node.id}
                className="absolute flex items-center justify-center rounded-lg bg-mauve-600 shadow-lg"
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  left: node.x - NODE_SIZE / 2,
                  top: node.y - NODE_SIZE / 2,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  phase >= 1
                    ? phase >= 4
                      ? { scale: 0.8, opacity: 0.25 }
                      : {
                          scale: 1,
                          opacity: 1,
                          boxShadow: phase >= 3
                            ? '0 0 0 4px rgba(90, 77, 89, 0.25), 0 0 24px rgba(90, 77, 89, 0.3), 0 4px 12px rgba(0,0,0,0.1)'
                            : '0 4px 12px rgba(0,0,0,0.1)',
                        }
                    : { scale: 0, opacity: 0 }
                }
                transition={{
                  delay: phase >= 1 ? i * 0.2 : 0,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
              </motion.div>
            );
          })}

          {phase >= 3 && (
            <motion.p
              className="absolute left-0 w-full text-center font-display text-lg font-bold tracking-display text-mauve-700"
              style={{ top: SVG_HEIGHT }}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: phase >= 4 ? 0.25 : 1, y: 0, scale: phase >= 4 ? 0.9 : 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {agentName}
            </motion.p>
          )}

          {phase >= 4 && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <motion.p
                className="font-display text-3xl font-bold tracking-display text-mauve-800"
                initial={{ opacity: 0, scale: 0.4, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.3 }}
              >
                Агент готов
              </motion.p>
            </motion.div>
          )}

          {phase >= 4 && (
            <div className="pointer-events-none absolute" style={{ left: SVG_WIDTH / 2, top: SVG_HEIGHT / 2 }}>
              {sparkles}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
