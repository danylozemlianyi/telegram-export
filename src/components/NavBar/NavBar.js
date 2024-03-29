import React from 'react';
import './NavBar.css';


const NavBar = ({ pages, setActivePage, activePage }) => {

    return (
        <nav className="navBar">
            {pages.map(page => (
                <a
                    key={page.name}
                    className={`navLink ${activePage === page.name ? 'activeLink' : ''}`}
                    onClick={() => setActivePage(page.name)}
                >
                    {page.name}
                </a>
            ))}
        </nav>
    );
};

export default NavBar;
