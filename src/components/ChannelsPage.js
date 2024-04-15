// src/ChannelsPage.js
import React, { useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

const ChannelsPage = ({data}) => {
    const [toSegment, setToSegment] = useState(null);

    let segments = [];
    data.forEach((value) => {
        if (!segments.includes(value.segment)) {
            segments.push(value.segment);
        }
    })

    const handleClose = () => setToSegment(null);
    const handleShow = (segment) => setToSegment(segment);

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
                    <Modal.Title>Modal heading adding to {toSegment}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group
                            className="mb-3"
                            controlId="exampleForm.ControlTextarea1"
                        >
                            <Form.Label>Example textarea</Form.Label>
                            <Form.Control as="textarea" rows={3} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChannelsPage;
