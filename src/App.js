import React, { useState, useEffect } from 'react';
import axios from 'axios';

// components
import ChannelsPage from "./components/ChannelsPage";
import NavBar from "./components/NavBar/NavBar";
import ParametersPage from "./components/ParametersPage";

const pages = [
    { name: "Manage Channels", component: ChannelsPage },
    { name: "Telegram Account Parameters", component: ParametersPage },
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

    useEffect(() => {
        if (tokenId) {
            const fetchData = async () => {
                try {
                    const result = await axios.get('http://localhost:5001/read_channels', {
                        headers: {
                            Authorization: `Bearer ${tokenId}`,
                            'Content-Type': 'application/json'
                        },
                    });
                    setData(result.data); // Ensure to set data with `result.data`
                } catch (error) {
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
                    /> : 'Page Not Found') : ('Not auth')}
            </div>
        </div>
    );
}

export default App;

