module.exports = {
    url: '/',
    sections: {
        navbar: {
            selector: "nav",
            elements: {
                brand: "a.navbar-brand",
                home: "li:nth-child(1) > a",
                backfill: "li:nth-child(2) > a",
                login: "button.my-sm-0"
            }
        },
        main: {
            selector: "div.mt-4",
            elements: {
                accordion: ".accordion",
                ukr: ".accordion-item:nth-child(2)",
                ukrButton: ".accordion-item:nth-child(2) button",
                katsap: ".accordion-item:nth-child(1)",
                katsapButton: ".accordion-item:nth-child(1) button",
                western: ".accordion-item:nth-child(3)",
                westernButton: ".accordion-item:nth-child(3) button",
            }
        },
        ukrChannelList: {
            selector: ".accordion-item:nth-child(2) .accordion-collapse",
            elements: {
                headers: "thead",
                add: "thead button.btn-success",
                firstRow: "tbody tr:nth-child(1)",
                firstRowDelete: "tbody tr:nth-child(1) button.btn-danger",
                firstRowEdit: "tbody tr:nth-child(1) button.btn-warning",
            }
        },
        katsapChannelList: {
            selector: ".accordion-item:nth-child(1) .accordion-collapse",
            elements: {
                headers: "thead",
                add: "thead button.btn-success",
                firstRow: "tbody tr:nth-child(1)",
                firstRowDelete: "tbody tr:nth-child(1) button.btn-danger",
                firstRowEdit: "tbody tr:nth-child(1) button.btn-warning",
            }
        },
        westernChannelList: {
            selector: ".accordion-item:nth-child(3) .accordion-collapse",
            elements: {
                headers: "thead",
                add: "thead button.btn-success",
                firstRow: "tbody tr:nth-child(1)",
                firstRowDelete: "tbody tr:nth-child(1) button.btn-danger",
                firstRowEdit: "tbody tr:nth-child(1) button.btn-warning",
            }
        },
        modal: {
            selector: "body > div.fade.modal.show > div > div",
            elements: {
                header: "div.modal-header",
                closeBtn: "button.btn-close",
            }
        }
    }
}