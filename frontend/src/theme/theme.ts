import { defineConfig, createSystem, defaultConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        customTextColor: {
          value: {
            _light: '#1a202c', // Couleur du texte en mode clair
            _dark: '#f7fafc', // Couleur du texte en mode sombre
          },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, customConfig);
export default system;
