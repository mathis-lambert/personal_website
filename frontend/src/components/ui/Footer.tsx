import React from 'react';
import { Link } from 'react-router-dom';
import { FaLinkedin } from 'react-icons/fa';
import { Heading4 } from '@/components/ui/Headings.tsx';

const Footer: React.FC = () => {
  // Fonction pour copier l'email dans le presse-papiers
  const copyEmail = () => {
    navigator.clipboard.writeText('mathislambert.dev@gmail.com');
    // On peut ajouter ici une notification si besoin
  };

  return (
    <footer
      id="site-footer"
      className="w-full border-t border-gray-200 dark:border-gray-500 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-lg rounded-t-2xl relative z-[100]"
    >
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Haut du footer */}
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Bloc Logo & Infos */}
          <div className="flex flex-col items-center lg:items-start">
            <Link to="/" className="flex items-center">
              {/* Remplace le src par l'URL de ton logo */}
              <Heading4 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Mathis <br />
                Lambert
              </Heading4>
            </Link>
            <div className="mt-4 text-sm text-gray-600 text-center lg:text-left dark:text-gray-400">
              <p>Based in Marseille, France 🇫🇷</p>
            </div>
          </div>

          {/* Bloc Projects */}
          {/* <div className="mt-8 lg:mt-0">
            <Heading4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Projects
            </Heading4>
            <ul className="mt-2 text-sm text-gray-600 space-y-1 dark:text-gray-400"></ul>
          </div> */}

          {/* Bloc Contact & Réseaux */}
          <div className="mt-8 lg:mt-0 flex flex-col items-center">
            <div className="text-sm text-gray-800 dark:text-gray-200">
              Reach me at:
            </div>
            <button
              onClick={copyEmail}
              className="mt-2 px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 transition ease-out text-sm text-gray-700 dark:text-gray-200"
            >
              mathislambert.dev@gmail.com
            </button>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-800 dark:text-gray-200">
                Follow Me:
              </span>
              <Link
                to="https://www.linkedin.com/in/mathis-lambert/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center"
              >
                {/* SVG de l'icône LinkedIn */}
                <FaLinkedin className="h-6 w-6 text-blue-600 hover:text-blue-800 transition duration-200" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bas du footer */}
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-500">
          <p className="text-xs text-center text-gray-500">
            © This site was designed and developed by Mathis Lambert -{' '}
            {new Date().getFullYear()}. All rights reserved.
          </p>
          <div className="mt-4 text-xs text-center text-gray-500">
            <Link to="/admin" className="bg-blue-100 hover:bg-blue-200 transition duration-200 rounded px-2 py-1">
              Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
