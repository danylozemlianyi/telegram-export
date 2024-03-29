// src/ChannelsPage.js
import React, { useState } from 'react';

const channelsData = [
    { category: 'ukr', channels: ['channel 1'] },
    { category: 'rus', channels: ['channel 2'] },
    { category: 'eng', channels: ['channel 3'] },
];

const ChannelsPage = () => {
    const [visibleCategories, setVisibleCategories] = useState({});

    const toggleChannels = (category) => {
        setVisibleCategories(prevState => ({
            ...prevState,
            [category]: !prevState[category]
        }));
    };

    return (
        <div>
            <h1>Manage Channels</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                <thead>
                <tr>
                    <th>CATEGORY</th>
                    <th>CHANNELS</th>
                    <th><button>+</button></th>
                </tr>
                </thead>
                <tbody>
                {channelsData.map(({ category, channels }, index) => (
                    <React.Fragment key={category}>
                        <tr onClick={() => toggleChannels(category)}>
                            <td>{category}</td>
                            <td></td>
                            <td></td>
                        </tr>
                        {visibleCategories[category] && channels.map(channel => (
                            <tr key={channel} className={`${category}Channels`} style={{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff' }}>
                                <td></td>
                                <td>{channel}</td>
                                <td><button>DELETE</button></td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChannelsPage;
