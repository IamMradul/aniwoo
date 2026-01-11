'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type FadeInSectionProps = {
  children: ReactNode;
  delay?: number;
} & HTMLAttributes<HTMLElement>;

export const FadeInSection = ({ children, delay = 0, className, ...rest }: FadeInSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.section>
  );
};
