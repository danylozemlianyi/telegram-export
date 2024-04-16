// src/ChannelsPage.js
import React, {createRef, useRef, useState} from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import {PencilFill, PlusCircle, Trash} from "react-bootstrap-icons";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import env from "react-dotenv";

const ChannelsPage = ({data, setReload, tokenId}) => {
    const idField = useRef(null);
    const langField = useRef(null);
    const segmentField = useRef(null);
    const formRef = useRef(null);
    const [showToast, setShowToast] = useState(false);


    const [idValue, setIdValue] = useState('');
    const [langValue, setLangValue] = useState('');
    const [segmentValue, setSegmentValue] = useState('');
    const [isUpdate, setIsUpdate] = useState(false);

    const [validated, setValidated] = useState(false);
    const [toSegment, setToSegment] = useState(null);
    const [channels, setChannels] = useState(data);

    let segments = [];
    data.forEach((value) => {
        if (!segments.includes(value.segment)) {
            segments.push(value.segment);
        }
    })
    let elementsRefs = [];
    data.forEach((value) => {
        elementsRefs.push(createRef());
    })
    const elementsRef = useRef(data.map(() => createRef()));
    const addChannel = (event) => {
        const form = formRef.current;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            console.log("FAILED")
        } else {
            console.log("PASSED")
            console.log(isUpdate ? "PUT" : "POST");
            console.log(idField.current.value);
            console.log(langField.current.value);
            console.log(segmentField.current.value);

            let id = idField.current.value;
            /*axios({
                method: isUpdate ? "PUT" : "POST",
                url: env.BACKEND_URL + '/channel/' + id,
                data: {
                    id: idField.current.value,
                    lang: langField.current.value,
                    segment: segmentField.current.value
                },
                headers: {
                    Authorization: `Bearer ${tokenId}`,
                    'Content-Type': 'application/json'
                },
            })
                .then(response => {
                    console.log(response);
                    toast.success('Channel ' + isUpdate ? "updated" : "created", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: false,
                        progress: undefined,
                        theme: "light",
                    });
                    setIdValue('');
                    setLangValue('');
                    setSegmentValue('');
                    setIsUpdate(false);
                    setToSegment(null);
                    setReload(true);
                })
                .catch(error => {
                    setIdValue('');
                    setLangValue('');
                    setSegmentValue('');
                    setIsUpdate(false);
                    setToSegment(null);
                    console.error(error);
                });*/
            formRef.current.reset();
        }
        setValidated(true);
    }
    const handleClose = () => {
        setIdValue('');
        setLangValue('');
        setSegmentValue('');
        setIsUpdate(false);
        setToSegment(null);
    }
    const handleShow = (segment) => {
        if (!isUpdate) setValidated(false);
        setSegmentValue(segment);
        setToSegment(segment);
    }

    function deleteChannel(id) {
        if (window.confirm("Are you sure you want to delete this channel?")) {

            axios.delete(env.BACKEND_URL + '/channel/' + id, {
                headers: {
                    Authorization: `Bearer ${tokenId}`,
                    'Content-Type': 'application/json'
                },
            })
                .then(response => {
                    console.log(response);
                    toast.success('Channel deleted', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: false,
                        progress: undefined,
                        theme: "light",
                    });
                    setReload(true);
                })
                .catch(error => {
                    console.error(error);
                });

        }
    }

    return (
        <div>
            <ToastContainer/>
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
                                        <Button variant="success" size="sm"
                                                onClick={() => handleShow(segment)}><PlusCircle/></Button>
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.map((item, index) => (
                                    item.segment === segment ?
                                        <tr ref={elementsRef.current[index]} key={`tr-${segmentIndex}-${index}`}>
                                            <td><Button variant="danger" size="sm" onClick={() => {
                                                deleteChannel(item.id)
                                            }}><Trash size={16}/></Button> <Button variant="warning" size="sm"
                                                                                   onClick={() => {
                                                                                       setToSegment(item.segment);
                                                                                       setIdValue(item.id);
                                                                                       setSegmentValue(item.segment);
                                                                                       setLangValue(item.lang);
                                                                                       setIsUpdate(true);
                                                                                   }}><PencilFill
                                                size={16}/></Button> {item.id}</td>
                                            <td>{item.lang}</td>
                                            <td></td>
                                        </tr> : ''
                                ))}
                                </tbody>
                            </table>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            {segments.map((segment, segmentIndex) => (
                <div className="modal fade" id={`modal-${segmentIndex}`} key={`modal-${segmentIndex}`} tabIndex="-1"
                     role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
                    <Modal.Title>{isUpdate ? 'Update' : 'Create'} channel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form validated={validated} ref={formRef} onSubmit={addChannel}>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>ID</Form.Label>
                            <Form.Control
                                ref={idField}
                                autoFocus
                                required={true}
                                defaultValue={idValue}
                            />
                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">
                                Please enter ID
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Segment</Form.Label>
                            <Form.Control ref={segmentField} type="text" defaultValue={segmentValue} disabled={true}/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Language</Form.Label>
                            <Form.Select ref={langField} required={true} defaultValue={langValue}>
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
