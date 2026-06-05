'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type FadeInSectionProps = {
  children: ReactNode;
  delay?: number;
  staggerChildren?: number;
} & Omit<HTMLMotionProps<'section'>, 'children' | 'initial' | 'whileInView' | 'viewport' | 'transition'>;

export const FadeInSection = ({ children, delay = 0, staggerChildren = 0, className, ...rest }: FadeInSectionProps) => {
  const variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        staggerChildren: staggerChildren || undefined,
        when: "beforeChildren",
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      className={className}
      {...rest}
    >
      {children}
    </motion.section>
  );
};

export const FadeInItem = ({ children, className }: { children: ReactNode, className?: string }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
