import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext.tsx';

const Navbar = () => {
  const { isChatOpen, openChat, closeChat } = useChat();

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-14 lg:h-20 z-50 lg:py-3"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className="absolute w-2/3 h-32 blur-3xl bg-gradient-to-t from-blue-300 to-blue-700 opacity-15 rounded-full  left-1/2 transform -translate-x-1/2 -z-10 -translate-y-1/2 lg:mx-6" />
      <div className="flex items-center justify-between h-full max-w-5xl mx-auto bg-white/10 border-b-white/50 lg:border-white/50 border-b-[1px] lg:border-[1px] shadow-lg backdrop-blur-md lg:rounded-full dark:bg-gray-800/10 dark:border-gray-700 px-2 py-4">
        <div className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <img
            src="/images/me.jpeg"
            alt="Profile pic"
            className="aspect-square inline-block bg-white rounded-full w-10 h-10 object-contain  hover:transform hover:scale-105 transition-transform duration-300"
          />
          Mathis
        </div>
        <nav className="hidden lg:flex items-center space-x-4">
          <Link
            to={'/'}
            className="text-gray-800 dark:text-white hover:text-blue-600 transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            to={'projects'}
            className="text-gray-800 dark:text-white hover:text-blue-600 transition-colors duration-300"
          >
            Projects
          </Link>
          <Link
            to={'blog'}
            className="text-gray-800 dark:text-white hover:text-blue-600 transition-colors duration-300"
          >
            Blog
          </Link>
          <Link
            to={'about'}
            className="text-gray-800 dark:text-white hover:text-blue-600 transition-colors duration-300"
          >
            About
          </Link>
          <Link
            to={'#'}
            onClick={(e) => {
              e.preventDefault();
              if (isChatOpen) {
                closeChat();
              } else {
                openChat();
              }
            }}
            className="text-gray-800 dark:text-white hover:text-blue-600 transition-colors duration-300"
          >
            Chat
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link
            to={'contact'}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 hover:transition-transform hover:-rotate-10"
          >
            Let's connect
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
