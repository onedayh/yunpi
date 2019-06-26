Component({
    methods: {
        formSubmit(e){
            const myEventDetail = {
                formId: e.detail.formId
            };
            const myEventOption = {};
            this.triggerEvent('formbutton', myEventDetail, myEventOption)
        }
    }
});