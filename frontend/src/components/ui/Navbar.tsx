import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, To } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext.tsx';

interface NavLink {
  to: To;
  text: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Navbar = () => {
  const { isChatOpen, openChat, closeChat } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChatToggle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
    setIsMenuOpen(false);
  };

  const navLinks = useMemo<NavLink[]>(
    () => [
      { to: '/', text: 'Home' },
      { to: 'projects', text: 'Projects' },
      { to: 'blog', text: 'Blog' },
      { to: 'about', text: 'About' },
      { to: '#', text: 'Chat', onClick: handleChatToggle }
    ],
    [isChatOpen, closeChat, openChat]
  );

  const connectLink: NavLink = {
    to: 'contact',
    text: 'Let\'s connect'
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const burgerVariants = {
    topOpen: { rotate: 45, y: 8 },
    topClosed: { rotate: 0, y: 0 },
    middleOpen: { opacity: 0 },
    middleClosed: { opacity: 1 },
    bottomOpen: { rotate: -45, y: -8 },
    bottomClosed: { rotate: 0, y: 0 }
  };

  const menuOverlayVariants = {
    hidden: { opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3,
        duration: 0.3,
        ease: 'easeOut'
      }
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -20,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: 'easeIn'
      }
    })
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-full h-14 lg:h-20 z-[1001] lg:py-3"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        exit={{ opacity: 0, y: -50 }}
      >
        <div
          className="absolute w-2/3 h-32 blur-3xl bg-gradient-to-t from-blue-300 to-blue-700 opacity-15 rounded-full left-1/2 transform -translate-x-1/2 -z-10 -translate-y-1/2 lg:mx-6" />
        <div
          className="flex items-center justify-between h-full max-w-5xl mx-auto bg-white/10 border-b-white/50 lg:border-white/50 border-b-[1px] lg:border-[1px] shadow-lg backdrop-blur-md lg:rounded-full dark:bg-gray-800/10 dark:border-gray-700 px-2 py-2">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group" onClick={closeMenu}>
            <img
              src="/images/me.jpeg"
              alt="Profile pic"
              className="aspect-square inline-block bg-white rounded-full w-10 h-10 object-contain group-hover:transform group-hover:scale-105 transition-transform duration-300"
            />
            <span
              className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              Mathis
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1 mx-4">
            {navLinks.map((link) => (
              <Link
                key={link.text}
                to={link.to}
                onClick={link.onClick}
                className="relative text-gray-800 dark:text-white px-3 py-1.5 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-700/40 transition-all duration-300 ease-out whitespace-nowrap"
              >
                {link.text}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4 lg:space-x-0">
            <Link
              to={connectLink.to}
              onClick={closeMenu}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-blue-500/30 hover:-rotate-3 text-sm lg:text-base flex-shrink-0"
            >
              {connectLink.text}
            </Link>

            <div className="lg:hidden">
              <button
                onClick={toggleMenu}
                className="z-50 flex flex-col justify-around w-6 h-6 bg-transparent border-none cursor-pointer p-0 focus:outline-none"
                aria-label="Toggle menu"
              >
                <motion.div
                  className="w-6 h-0.5 bg-gray-800 dark:bg-white rounded-full origin-center"
                  variants={burgerVariants}
                  animate={isMenuOpen ? 'topOpen' : 'topClosed'}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
                <motion.div
                  className="w-6 h-0.5 bg-gray-800 dark:bg-white rounded-full origin-center"
                  variants={burgerVariants}
                  animate={isMenuOpen ? 'middleOpen' : 'middleClosed'}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
                <motion.div
                  className="w-6 h-0.5 bg-gray-800 dark:bg-white rounded-full origin-center"
                  variants={burgerVariants}
                  animate={isMenuOpen ? 'bottomOpen' : 'bottomClosed'}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg flex flex-col items-center justify-center space-y-6"
            variants={menuOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.text}
                custom={index}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full px-8 flex justify-center" // Ensure container allows full width for hover effect
              >
                <Link
                  to={link.to}
                  onClick={(e) => {
                    // No need to check isChatOpen here, closeChat does nothing if already closed
                    closeChat(); // Always attempt to close chat when navigating from mobile overlay

                    if (link.onClick) {
                      link.onClick(e); // This handles the chat toggle specifically
                      // Keep menu open for chat toggle interaction if needed, handled in handleChatToggle
                    } else {
                      closeMenu(); // Close menu for regular navigation links
                    }
                  }}
                  className="block text-center text-3xl font-medium text-gray-800 dark:text-white px-6 py-3 rounded-lg transform transition-all duration-300 ease-out hover:bg-blue-500/10 dark:hover:bg-blue-400/10 hover:text-blue-600 dark:hover:text-blue-400 hover:-translate-y-1 hover:scale-105"
                >
                  {link.text}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;