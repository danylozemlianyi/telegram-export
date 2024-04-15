import React from 'react';
import {googleLogout, useGoogleLogin} from "@react-oauth/google";


const NavBar = ({pages, setActivePage, activePage, setTokenId, tokenId}) => {


    function signOut() {
        googleLogout();
        setTokenId(null);
    }

    const login = useGoogleLogin({
        //flow: 'auth-code',
        onSuccess: tokenResponse => {
            setTokenId(tokenResponse.access_token);
        },
        onError: () => console.error('Login failed')
    });
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <a className="navbar-brand" href={"#"}>Telegram Data Export</a>
                {tokenId ? <>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="nav navbar-nav">

                            {pages.map((page, index) => (
                                <li className={`nav-item  ${activePage === page.name ? 'active' : ''}`} key={index}>
                                    <a
                                        href={"#"}
                                        key={page.name}
                                        className={`nav-link ${activePage === page.name ? 'active' : ''}`}
                                        onClick={() => setActivePage(page.name)}
                                    >
                                        {page.name}
                                    </a>
                                </li>
                            ))}

                        </ul>

                    </div>
                </> : <></>}

                <div className="nav navbar-right">
                    {!tokenId ? (
                        <button className={"btn btn-outline-success my-2 my-sm-0"} onClick={() => login()}>Sign in with
                            Google 🚀</button>
                    ) : (
                        <div>
                            <button className={"btn btn-outline-warning my-2 my-sm-0"}
                                    onClick={() => signOut()}>Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
