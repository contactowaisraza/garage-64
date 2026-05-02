import React from 'react';
import { motion } from 'framer-motion';

const SectionTitle = ({ title, subtitle, className = '' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mb-10 ${className}`}
    >
      <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
        {title}
      </h2>
      <div className="w-20 h-1.5 bg-primary rounded-full mb-4"></div>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionTitle;