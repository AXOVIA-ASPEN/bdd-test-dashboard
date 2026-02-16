'use client';
import { motion } from 'framer-motion';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <FileQuestion className="w-16 h-16 text-muted mx-auto" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl font-semibold text-foreground">Page Not Found</p>
          <p className="text-sm text-muted max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
