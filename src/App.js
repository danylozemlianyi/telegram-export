import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

// components
import ChannelsPage from "./components/ChannelsPage";
import NavBar from "./components/NavBar/NavBar";
import ParametersPage from "./components/ParametersPage";
import env from "react-dotenv";

const pages = [
    { name: "Manage Channels", component: ChannelsPage },
    { name: "Backfill", component: ParametersPage },
    // додайте інші сторінки, як потрібно
];

function useStickyState(defaultValue, key) {
    const [value, setValue] = React.useState(() => {
        const stickyValue = window.localStorage.getItem(key);
        return stickyValue !== null
            ? JSON.parse(stickyValue)
            : defaultValue;
    });
    React.useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}

function App() {
    const [activePage, setActivePage] = useState(pages[0].name);
    const [tokenId, setTokenId] = useStickyState(null, 'tokenId');
    const [data, setData] = useState([]);
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        if (tokenId) {
            const fetchData = async () => {
                try {
                    const result = await axios.get(env.BACKEND_URL + '/read_channels', {
                        headers: {
                            Authorization: `Bearer ${tokenId}`,
                            'Content-Type': 'application/json'
                        },
                    });
                    setData(result.data); // Ensure to set data with `result.data`
                } catch (error) {
                    if (error.response?.status === 401) {
                        setTokenId(null);
                    }
                    if (error.response?.status === 403) {
                        handleShow();
                        setTokenId(null);
                    }
                    console.log("ERRORREEED");
                    console.log(error);
                    console.error('Error fetching data:', error);
                }
            };
            fetchData();
        }
    }, [tokenId]); // Depend on `tokenId`

    const ActivePageComponent = pages.find(page => page.name === activePage)?.component;

    return (
        <div>
            <NavBar pages={pages} setActivePage={setActivePage} activePage={activePage} tokenId={tokenId} setTokenId={setTokenId}/>
            <div className={"mt-4 mb-4 container"}>
                {tokenId ? (ActivePageComponent ?
                    <ActivePageComponent
                        data={data}
                        tokenId={tokenId}
                    /> : 'Page Not Found') : ('Not auth')}
            </div>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Access denied</Modal.Title>
                </Modal.Header>
                <Modal.Body>Sorry, you don't have access to this page. Please sign in with correct Google account.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default App;

