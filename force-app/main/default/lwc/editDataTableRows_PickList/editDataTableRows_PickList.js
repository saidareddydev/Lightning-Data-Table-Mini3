import { LightningElement,wire,api } from 'lwc';
import getContactBasedOnAccount from "@salesforce/apex/ContactDetailsHandler.getContactBasedOnAccount";
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from '@salesforce/apex';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import LEAD_SOURCE from '@salesforce/schema/Contact.LeadSource';

const columns = [
    { label: 'First Name', fieldName: 'FirstName', editable : true,hideDefaultActions:true },
    { label: 'Last Name', fieldName: 'LastName', editable : true,hideDefaultActions:true },
    { label: 'Title', fieldName: 'Title', editable : true,hideDefaultActions:true },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', editable : true,hideDefaultActions:true  },
    { label: 'Email', fieldName: 'Email', type: 'email' , editable : true,hideDefaultActions:true },
    { label : "Lead Source",
    fieldName : "LeadSource" ,
    type : "customPicklist",
    editable : true ,
    typeAttributes : {
     options : {fieldName : "pickListOptions"},
     value : {fieldName : "LeadSource"},
     context : {fieldName : "Id"}        
    },
}
    
];

export default class EditDataTableRows_PickList extends LightningElement {
    @api recordId;
    contactData = [];
    columns = columns;
    draftValues = [];
    contactRefrshProp;
    leadSourceOptions = [];

    @wire(getContactBasedOnAccount,{
         accountId : "$recordId",
        pickList : "$leadSourceOptions"
        
    })
    
    getContactOutput(result){
        this.contactRefrshProp = result;
        if(result.data){
           // this.contactData = result.data;
           console.log("Lead Source Options Polulated..")
           this.contactData = result.data.map((currentItem)=>{
            let pickListOptions = this.leadSourceOptions;
            return {
                ...currentItem,
                pickListOptions : pickListOptions
            };
           });

        } else if(result.error){
            console.log("Error While Loading Records....");
        }
    }

    @wire(getObjectInfo,{
        objectApiName : CONTACT_OBJECT
    }) objectInfo;

    @wire(getPicklistValues,{
        recordTypeId : "$objectInfo.data.defaultRecordTypeId",
        fieldApiName : LEAD_SOURCE
    })wirePicklist({data,error}){
        if(data){
            this.leadSourceOptions = data.values;
            console.log("this.leadSourceOptions",this.leadSourceOptions);
        } else if(error){
            console.log("Error While Loading Data ",error);
        }
    }

    async saveHandler(event){

        let records =  event.detail.draftValues; // Array of Modifyied Records

        let updateRecordsArray = records.map((currentItem)=>{
            let fieldInput = {...currentItem};
            return {
                fields : fieldInput
            };
           });
           this.draftValues = [];
           let updateRecordsArrayPromise = updateRecordsArray.map((currItem)=>updateRecord(currItem));
           await Promise.all(updateRecordsArrayPromise);

           const evt = new ShowToastEvent({
            title: 'Success',
            message:'Records Updated Successfully....',
            variant : 'success'
        });
        this.dispatchEvent(evt);
        await refreshApex(this.contactRefrshProp);
        }
}