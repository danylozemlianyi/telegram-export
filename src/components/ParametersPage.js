import React, {forwardRef, useState} from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Сторінка Telegram Account Parameters
const TelegramAccountParameters = ({}) => {
    /*const handleSave = (newValue, parameterId) => {
        console.log(`Save ${parameterId}:`, newValue);
        // Тут може бути логіка для надсилання нового значення на сервер
    };*/
    const [startDate, setStartDate] = useState(new Date());
    const [startDateRange, setStartDateRange] = useState(new Date());
    const [endDateRange, setEndDateRange] = useState(new Date());
    const onChangeRange = (dates) => {
        const [start, end] = dates;
        setStartDateRange(start);
        setEndDateRange(end);
    };
    const ExampleCustomInput = forwardRef(({ value, onClick, title }, ref) => (<>
            <label htmlFor={`input-${ref}`} className="col-form-label">{title}</label>
            <input ref={ref} onClick={onClick} type="text" id={`input-${ref}`} className="form-control w-100" value={value} readOnly={true} />
        </>));

    return (
        <>
            <h1>Telegram Account Parameters</h1>
            <form>
                <div className={"mb-2"}>
                        <DatePicker
                            title={'single'}
                            wrapperClassName={'col-lg-2'}
                            customInput={<ExampleCustomInput />}
                            selected={startDate}
                            filterDate={(date) => date >= new Date(new Date() - 60 * 60 * 24 * 1000)}
                            onChange={(date) => setStartDate(date)}
                        />
                </div>
                <div className={"mb-2"}>
                        <DatePicker
                            wrapperClassName={'col-lg-2'}
                            title={'range'}
                            customInput={<ExampleCustomInput/>}
                            selected={startDateRange}
                            startDate={startDateRange}
                            endDate={endDateRange}
                            selectsRange
                            filterDate={(date) => date <= new Date()}
                            onChange={(date) => onChangeRange(date)}
                        />
                </div>
                <button type="submit" className="btn btn-primary mt-4">SAVE</button>
            </form>
        </>
    );
};

export default TelegramAccountParameters;
