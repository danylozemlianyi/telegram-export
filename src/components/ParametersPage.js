import React, { useState } from 'react';

// Форма для зміни параметрів
const ParameterForm = ({ title, placeholder, parameterId, onSubmit }) => {
    const [value, setValue] = useState('');

    return (
        <div className={"mb-2"}>
            <label htmlFor={`input-${parameterId}`} className="col-form-label">{title}</label>
            <input type="text" id={`input-${parameterId}`} className="form-control" aria-describedby="passwordHelpInline" placeholder={placeholder} />
        </div>
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
            <form>
                <table>
                    <tbody>
                        <ParameterForm title={"API Token"} placeholder={"<my_api_token>"} parameterId="API_TOKEN" />
                        <ParameterForm title={"USERBOT ID"} placeholder={"434523433424"} parameterId="USERBOT_ID" />
                        <ParameterForm title={"USERBOT PHONE NUMBER"} placeholder={"+380123456789"} parameterId="USERBOT_PHONE_NUMBER" />
                    </tbody>
                </table>
                <button type="submit"  className="btn btn-primary mt-4">SAVE</button>
            </form>
        </>
    );
};

export default TelegramAccountParameters;
