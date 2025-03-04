import {Outlet} from 'react-router-dom';
import AbstractGradientBackground from "../components/abstractGradientBackground/abstractGradientBackground.tsx";

const Layout = () => {
    return (
        <>
            {/* Background universel */}
            <AbstractGradientBackground/>
            {/* Contenu dynamique selon la route */}
            <div className="layout-outlet">
                <Outlet/>
            </div>
        </>
    );
};

export default Layout;
