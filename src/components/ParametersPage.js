import React, {forwardRef, useState} from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import env from "react-dotenv";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";


const TelegramAccountParameters = ({tokenId}) => {
    /*const handleSave = (newValue, parameterId) => {
        console.log(`Save ${parameterId}:`, newValue);
        // Тут може бути логіка для надсилання нового значення на сервер
    };*/
    const [startDate, setStartDate] = useState(new Date());
    const [startDateRange, setStartDateRange] = useState(new Date());
    const [endDateRange, setEndDateRange] = useState(new Date());
    const [show, setShow] = useState(false);
    const [backfillData, setBackfillData] = useState('');

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const onChangeRange = (dates) => {
        const [start, end] = dates;
        setStartDateRange(start);
        setEndDateRange(end);
    };
    const ExampleCustomInput = forwardRef(({ value, onClick, title }, ref) => (<>
            <label htmlFor={`input-${ref}`} className="col-form-label">{title}</label>
            <input ref={ref} onClick={onClick} type="text" id={`input-${ref}`} className="form-control w-100" value={value} readOnly={true} />
        </>));

    const handleSubmit = (event) => {
        event.preventDefault();

        const data = {
            singleDate: startDate,
            dateRange: {start: startDateRange, end: endDateRange}
        };

        axios.post(env.BACKEND_URL + '/create_backfill', JSON.stringify(data), {
            headers: {
                Authorization: `Bearer ${tokenId}`,
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                console.log(response);
                setBackfillData(response.data);
                handleShow();
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <>
            <h1>Create backfill</h1>
            <form>
                <div className={"mb-2"}>
                        <DatePicker
                            title={'Creation date'}
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
                            title={'Dates range for filling'}
                            customInput={<ExampleCustomInput/>}
                            selected={startDateRange}
                            startDate={startDateRange}
                            endDate={endDateRange}
                            selectsRange
                            filterDate={(date) => date <= new Date()}
                            onChange={(date) => onChangeRange(date)}
                        />
                </div>
                <button type="submit" className="btn btn-primary mt-4" onClick={handleSubmit}>Create backfill</button>
            </form>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Backfill created</Modal.Title>
                </Modal.Header>
                <Modal.Body>{backfillData}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default TelegramAccountParameters;
