import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center text-primary-foreground"
        aria-label="Kirim Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </motion.button>

      <FeedbackForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FeedbackButton;
