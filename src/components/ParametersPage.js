import React, { useState } from 'react';

// Форма для зміни параметрів
const ParameterForm = ({ parameterId, onSubmit }) => {
    const [value, setValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(value);
        setValue('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="type new value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
            />
            <button type="submit">SAVE</button>
        </form>
    );
};

// Сторінка Telegram Account Parameters
const TelegramAccountParameters = () => {
    const handleSave = (newValue, parameterId) => {
        console.log(`Save ${parameterId}:`, newValue);
        // Тут може бути логіка для надсилання нового значення на сервер
    };

    return (
        <>
            <h1>Telegram Account Parameters</h1>
            <table>
                <thead>
                <tr>
                    <th>NAME</th>
                    <th>VALUE</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>API_TOKEN</td>
                    <td>&lt;my_api_token&gt;</td>
                    <td>
                        <ParameterForm parameterId="API_TOKEN" onSubmit={(value) => handleSave(value, 'API_TOKEN')} />
                    </td>
                </tr>
                <tr>
                    <td>USERBOT_ID</td>
                    <td>434523433424</td>
                    <td>
                        <ParameterForm parameterId="USERBOT_ID" onSubmit={(value) => handleSave(value, 'USERBOT_ID')} />
                    </td>
                </tr>
                <tr>
                    <td>USERBOT_PHONE_NUMBER</td>
                    <td>+380123456789</td>
                    <td>
                        <ParameterForm parameterId="USERBOT_PHONE_NUMBER" onSubmit={(value) => handleSave(value, 'USERBOT_PHONE_NUMBER')} />
                    </td>
                </tr>
                </tbody>
            </table>
        </>
    );
};

export default TelegramAccountParameters;
