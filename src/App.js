import React, { useState } from 'react';

// components
import ChannelsPage from "./components/ChannelsPage";
import NavBar from "./components/NavBar/NavBar";
import ParametersPage from "./components/ParametersPage";

const pages = [
    { name: "Manage Channels", component: ChannelsPage },
    { name: "Telegram Account Parameters", component: ParametersPage },
    //  інші сторінки тут
];

function App() {
    const [activePage, setActivePage] = useState(pages[0].name);

    const ActivePageComponent = pages.find(page => page.name === activePage)?.component;

    return (
        <div>
            <NavBar pages={pages} setActivePage={setActivePage} activePage={activePage} />
            {ActivePageComponent ? <ActivePageComponent /> : "Page Not Found"}
        </div>
    );
}

export default App;
