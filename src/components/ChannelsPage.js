// src/ChannelsPage.js
import React, {useRef, useState} from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

const ChannelsPage = ({data}) => {
    const idField = useRef(null);
    const langField = useRef(null);
    const segmentField = useRef(null);
    const formRef = useRef(null);
    const [validated, setValidated] = useState(false);
    const [toSegment, setToSegment] = useState(null);

    let segments = [];
    data.forEach((value) => {
        if (!segments.includes(value.segment)) {
            segments.push(value.segment);
        }
    })

    const addChannel = (event) => {
        const form = formRef.current;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            console.log("FAILED")
        } else {
            console.log("PASSED")
            console.log(event);
            console.log(idField.current.value);
            console.log(langField.current.value);
            console.log(segmentField.current.value);
            formRef.current.reset();
        }
        setValidated(true);
    }
    const handleClose = () => setToSegment(null);
    const handleShow = (segment) => {
        setValidated(false);
        setToSegment(segment);
    }

    return (
        <div>
            <h1 className={"mb-4"}>Manage Channels</h1>
            <Accordion>
                {segments.map((segment, segmentIndex) => (
                        <Accordion.Item eventKey={`${segmentIndex}`} key={`accordion-item-${segmentIndex}`}>
                            <Accordion.Header>{segment}</Accordion.Header>
                            <Accordion.Body className={"bg-light"}>
                                <table key={`table-${segmentIndex}`} className={"w-100"}>
                                    <thead className={"sticky-top bg-light"}>
                                    <tr>
                                        <th>TITLE</th>
                                        <th>LANGUAGE</th>
                                        <th className={"text-end"}>
                                            <Button variant="success" onClick={() => handleShow(segment)}>+</Button>
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(({ category, channels }, index) => (
                                                data.map((item, index) => (
                                                    item.segment === segment ?
                                                        <tr key={`tr-${segmentIndex}-${index}`}>
                                                            <td>{item.id}</td>
                                                            <td>{item.lang}</td>
                                                            <td></td>
                                                        </tr> : ''
                                                ))
                                        ))}
                                    </tbody>
                                </table>
                            </Accordion.Body>
                        </Accordion.Item>
                ))}
            </Accordion>

            {segments.map((segment, segmentIndex) => (
                <div className="modal fade" id={`modal-${segmentIndex}`} key={`modal-${segmentIndex}`} tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel">Modal title</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                ...
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-primary">Save changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <Modal show={toSegment} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Create channel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form validated={validated} ref={formRef} onSubmit={addChannel}>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>ID</Form.Label>
                            <Form.Control
                                ref={idField}
                                autoFocus
                                required={true}
                            />
                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">
                                Please enter ID
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Segment</Form.Label>
                            <Form.Control ref={segmentField} type="text" defaultValue={toSegment} disabled={true} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Language</Form.Label>
                            <Form.Select ref={langField} required={true} defaultValue={""}>
                                <option disabled value="">Select language</option>
                                <option value="ukr">ukr</option>
                                <option value="katsap">katsap</option>
                                <option value="en">en</option>
                                <option value="eng">eng</option>
                            </Form.Select>
                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">
                                Please select language
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" type={"reset"} onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" type={"submit"} onClick={addChannel}>
                        Add channel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChannelsPage;
