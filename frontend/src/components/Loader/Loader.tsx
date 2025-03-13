import { Flex, Spinner, Text } from '@chakra-ui/react';

function Loader({ message = 'Chargement...' }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      height="100vh"
      bg="gray.100"
    >
      <Spinner
        size="xl"
        colorPalette="teal"
      />
      <Text mt={4} fontSize="lg" color="gray.600">
        {message}
      </Text>
    </Flex>
  );
}

export default Loader;
