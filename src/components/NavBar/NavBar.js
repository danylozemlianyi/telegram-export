import React from 'react';
import {googleLogout, useGoogleLogin} from "@react-oauth/google";


const NavBar = ({pages, setActivePage, activePage, setTokenId, tokenId}) => {


    function signOut() {
        googleLogout();
        setTokenId(null);
    }

    // https://accounts.google.com/o/oauth2/v2/auth?gsiwebsdk=3&client_id=355066778043-1a4b58q71uvm47kvuddk60c6r5d4796b.apps.googleusercontent.com&scope=openid%20profile%20email&redirect_uri=storagerelay%3A%2F%2Fhttp%2F127.0.0.1%3A3000%3Fid%3Dauth43835&prompt=select_account&response_type=token&include_granted_scopes=true&enable_granular_consent=true

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
