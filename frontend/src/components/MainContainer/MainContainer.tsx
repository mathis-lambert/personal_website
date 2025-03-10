import './MainContainer.scss';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

const MainContainer: React.FC<Props> = ({ children }) => {
  return <div className="main-container">{children}</div>;
};

export default MainContainer;
