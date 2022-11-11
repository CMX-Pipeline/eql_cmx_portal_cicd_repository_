if (typeof (EQL) === "undefined") { EQL = {}; }
if (typeof (EQL.WebResource) === "undefined") { EQL.WebResource = {}; }
if (typeof (EQL.WebResource.EWR) === "undefined") { EQL.WebResource.EWR = {}; }

let ewr_isValidationNeeded = true;

EQL.WebResource.EWR.formOnLoad = function (executionContext) {
    var formContext = executionContext.getFormContext();
    EQL.WebResource.EWR.setLicensingDetailsToEditable(executionContext);
    EQL.WebResource.EWR.showOverrideReason(executionContext);
    EQL.WebResource.EWR.showNotificationOnLoad(executionContext);
    EQL.WebResource.EWR.ewrValidation(executionContext);
    EQL.WebResource.EWR.ewrSupplyTypeOnLoad(executionContext);
    EQL.WebResource.EWR.filterSecondaryServiceSelection(executionContext);
    EQL.WebResource.EWR.setDeclarationLabel(executionContext);
};

EQL.WebResource.EWR.showOverrideReason = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let overrideToggle = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).getValue();
    if (overrideToggle === true) {
        formContext.getControl(EQL.WebResource.EWR.Fields.ECOverrideReason).setVisible(true);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideReason).setRequiredLevel("required");
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).setRequiredLevel("none");
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).setRequiredLevel("none");
    }
    else {
        formContext.getControl(EQL.WebResource.EWR.Fields.ECOverrideReason).setVisible(false);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideReason).setRequiredLevel("none");
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideReason).setValue(null);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).setRequiredLevel("required");
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).setRequiredLevel("required");
    }
};

EQL.WebResource.EWR.setLicensingDetailsToEditable = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let formType = formContext.ui.getFormType();
    // If Form Type = Editable
    if (formType === 2) {
        let overrideToggle = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).getValue();
        // Check if Override Toggle = Yes
        if (overrideToggle === true) {
            formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setDisabled(false);
            formContext.getControl(EQL.WebResource.EWR.Fields.ECLicenceNumber).setDisabled(false);
            formContext.getControl(EQL.WebResource.EWR.Fields.ECExpiryDate).setDisabled(false);
        }
        else {
            formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setDisabled(true);
            formContext.getControl(EQL.WebResource.EWR.Fields.ECLicenceNumber).setDisabled(true);
            formContext.getControl(EQL.WebResource.EWR.Fields.ECExpiryDate).setDisabled(true);
        }
    }
};

EQL.WebResource.EWR.checkLicenseNumber = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let licenseNumber = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getValue();
    let expiryDate = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).getValue();
    let licenseNumberChanged = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getIsDirty();
    // If License Number has value
    if (licenseNumber !== null) {
        Xrm.WebApi.retrieveMultipleRecords("contact", "?$select=ava_licensenumber,ava_expirydate&$filter=ava_licensenumber eq '" + licenseNumber + "'").then(
            function success(result) {
                // If License Number Exists
                if (result.entities.length > 0) {
                    // If License Number is not null and Expiry Date is null
                    formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
                    formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");
                    if ((licenseNumber !== null) && (expiryDate === null)) {
                        // Check if License Number Changed Values
                        if (licenseNumberChanged !== false) {
                            //formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).setValue(true);
                            //EQL.WebResource.EWR.showOverrideReason(executionContext);
                            //EQL.WebResource.EWR.notificationMessageFunction("License Number is Valid", "License Number Valid");
                        }
                        else {
                            EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "License Number is Valid. Expiry Date is not present");
                        }
                    }
                    // Both License Number and Expiry Date is not null
                    else {
                        EQL.WebResource.EWR.checkExpiryDate(executionContext);
                    }

                }
                // If License Number doesn't Exists
                else {
                    // This only applies when License Number is Invalid but there's value in Expiry Date
                    if (((licenseNumber !== null) && (expiryDate !== null)) || (licenseNumber !== null)) {
                        formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
                        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");
                        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).setValue(true);
                        EQL.WebResource.EWR.showOverrideReason(executionContext);
                    }
                    // Check if License Number Changed Values
                    if (licenseNumberChanged !== false) {
                        EQL.WebResource.EWR.notificationMessageFunction("License Number is Invalid", "License Number Invalid");
                    }
                    else {
                        EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "License Number is Invalid");
                    }
                }
            },
            function (error) {
                //None
            }
        );
    }
    // If License Number doesn't have value
    else {
        formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(false);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("none");
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setValue(null);
    }
};

EQL.WebResource.EWR.checkExpiryDate = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let licenseNumber = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getValue();
    let expiryDate = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).getValue();
    let licenseNumberChanged = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getIsDirty();
    let expiryDateChanged = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).getIsDirty();

    // If License Number and Expiry Date has values
    if ((licenseNumber !== null) && (expiryDate !== null)) {
        let expiredDate = new Date(expiryDate);
        let formattedExpiredDate = expiredDate.getFullYear() + "-" + (expiredDate.getMonth() + 1) + "-" + expiredDate.getDate();
        Xrm.WebApi.retrieveMultipleRecords("contact", "?$select=ava_licensenumber,ava_expirydate&$filter=ava_licensenumber eq '" + licenseNumber + "'").then(
            function success(result) {
                // If License Number Provided is Valid
                if (result.entities.length > 0) {
                    for (let i = 0; i < result.entities.length; i++) {
                        let retrievedExpiryDate = new Date(result.entities[i]["ava_expirydate"]);
                        let formattedLicenseExpiryDate = retrievedExpiryDate.getFullYear() + "-" + (retrievedExpiryDate.getMonth() + 1) + "-" + retrievedExpiryDate.getDate();
                        // If Contact Expiry Date matches what is entered in the Expiry Date in the EWR
                        if (formattedExpiredDate === formattedLicenseExpiryDate) {
                            //If Expiry Date is not Expired, License Number and Expiry Date are valid
                            if (retrievedExpiryDate > new Date()) {
                                // Provide actions here
                                formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(false);
                                formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("none");
                                formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setValue(null);

                            }
                            //If Expiry Date is Expired
                            else {
                                // Provide actions here
                                formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
                                formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");
                                // If License Number/Expiry Date is Changed, Show Notification
                                if ((licenseNumberChanged !== false) || (expiryDateChanged !== false)) {
                                    formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).setValue(true);
                                    EQL.WebResource.EWR.showOverrideReason(executionContext);
                                    EQL.WebResource.EWR.notificationMessageFunction("License Number is expired", "License Expired");
                                }
                                // Else, show only Form-level Notification since there's no change in either License Number/Expiry Date if Form Type = Update
                                else {
                                    EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "License Number is expired");
                                }
                            }
                        }
                        // If Contact Expiry Date doesn't matched what is entered in the Expiry Date in the EWR
                        else {
                            // Provide actions here
                            formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
                            formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");
                            // If License Number/Expiry Date is Changed, Show Notification
                            if ((licenseNumberChanged !== false) || (expiryDateChanged !== false)) {
                                formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).setValue(true);
                                EQL.WebResource.EWR.showOverrideReason(executionContext);
                                EQL.WebResource.EWR.notificationMessageFunction("Expiry date is invalid", "Expiry Date Invalid");
                            }
                            // Else, show only Form-level Notification since there's no change in either License Number/Expiry Date if Form Type = Update
                            else {
                                EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "Expiry date is invalid");
                            }

                        }
                    }
                }
                // If License Number Provided is Invalid
                else {
                    // Provide actions here
                    formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
                    formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");
                    // If License Number/Expiry Date is Changed, Show Notification
                    if ((licenseNumberChanged !== false) || (expiryDateChanged !== false)) {
                        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).setValue(true);
                        EQL.WebResource.EWR.showOverrideReason(executionContext);
                        EQL.WebResource.EWR.notificationMessageFunction("License Number is Invalid", "License Number Invalid");
                    }
                    // Else, show only Form-level Notification since there's no change in either License Number/Expiry Date if Form Type = Update
                    else {
                        EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "License Number is Invalid");
                    }
                }
                // End
            },
            function (error) {
                // None
            }
        );
    }
    // Other scenario
    else {
        formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(true);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("required");

        //Check if License Number and Expiry Date is null
        if ((licenseNumber === null) && (expiryDate === null)) {
            formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(false);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("none");
            formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setValue(null);
        }

        // Covers only the scenario of License Number is null and Expiry Date is Not Null
        if ((licenseNumber === null) && (expiryDate !== null)) {
            formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(false);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("none");
            if (expiryDateChanged !== false) {
                EQL.WebResource.EWR.notificationMessageFunction("No License Number provided", "No License Number provided");
            }
            // Else, show only Form-level Notification since there's no change in either License Number/Expiry Date if Form Type = Update
            else {
                EQL.WebResource.EWR.formLevelNotificationMessageFunction(formContext, "No License Number provided");
            }
        }
        // No actions if License Number is valid and Expiry date has value
    }
};

EQL.WebResource.EWR.showNotificationOnLoad = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let licenseNumber = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getValue();
    let expiryDate = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).getValue();

    // If License Number have value but expiry date doesn't have value
    if ((licenseNumber !== null) && (expiryDate === null)) {
        EQL.WebResource.EWR.checkLicenseNumber(executionContext);
    }
    // If License Number doesn't value but expiry date have value
    else if ((licenseNumber === null) && (expiryDate !== null)) {
        EQL.WebResource.EWR.checkExpiryDate(executionContext);
    }
    else if ((licenseNumber === null) && (expiryDate === null)) {
        formContext.getControl(EQL.WebResource.EWR.Fields.ECBusinessName).setVisible(false);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.ECBusinessName).setRequiredLevel("none");
    }
    //Both expiry date and License Number have value
    else {
        EQL.WebResource.EWR.checkExpiryDate(executionContext);
    }
};

EQL.WebResource.EWR.onSaveCheckIfValid = function (executionContext) {
    "use strict";
    try {
        var formContext = executionContext.getFormContext();
        let SaveMode = {
            Save: 1,
            SaveAndClose: 2,
            SaveAndNew: 59,
            Autosave: 70
        };
        if (executionContext.getEventArgs().isDefaultPrevented()) {
            return;
        }
        //getting save mode from event
        let saveMode = executionContext.getEventArgs().getSaveMode();
        //if savemode is not one of listed - just quit the execution and let the record to be saved
        if (saveMode !== SaveMode.Save &&
            saveMode !== SaveMode.SaveAndClose &&
            saveMode !== SaveMode.SaveAndNew &&
            saveMode !== SaveMode.Autosave) {
            return;
        }
        if (!ewr_isValidationNeeded) {
            ewr_isValidationNeeded = true;
            return;
        }
        executionContext.getEventArgs().preventDefault();
        let returnedPromise = EQL.WebResource.EWR.onSaveValidation(executionContext);
        returnedPromise.then(
            function (promResolve) {
                if (promResolve === false) {
                    //do nothing
                } else {
                    ewr_isValidationNeeded = false;
                    if (saveMode === SaveMode.Save ||
                        saveMode === SaveMode.Autosave) {
                        if (formContext.data.entity.getIsDirty() == false) {
                            return;
                        }
                        else {
                            formContext.data.entity.save();
                        }
                    } else if (saveMode === SaveMode.SaveAndClose) {
                        if (formContext.data.entity.getIsDirty() == false) {
                            return;
                        }
                        else {
                            formContext.data.entity.save("saveandclose");
                        }
                    } else {
                        if (formContext.data.entity.getIsDirty() == false) {
                            return;
                        }
                        else {
                            formContext.data.entity.save("saveandnew");
                        }
                    }
                }
            }
        );
    } catch (e) {
        //None
    }
};

EQL.WebResource.EWR.onSaveValidation = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let licenseNumber = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECLicenceNumber).getValue();
    let expiryDate = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECExpiryDate).getValue();
    let overrideToggle = formContext.getAttribute(EQL.WebResource.EWR.Fields.ECOverrideToggle).getValue();
    return new Promise(function (promResolve, promReject) {
        let resolve = false;
        let reject = false;
        if ((licenseNumber !== null) && (expiryDate !== null)) {
            let expiredDate = new Date(expiryDate);
            let formattedExpiredDate = expiredDate.getFullYear() + "-" + (expiredDate.getMonth() + 1) + "-" + expiredDate.getDate();
            Xrm.WebApi.retrieveMultipleRecords("contact", "?$select=ava_licensenumber,ava_expirydate&$filter=ava_licensenumber eq '" + licenseNumber + "'").then(
                function success(result) {
                    if (result.entities.length > 0) {
                        let retrievedExpiryDate = new Date(result.entities[0]["ava_expirydate"]);
                        let formattedLicenseExpiryDate = retrievedExpiryDate.getFullYear() + "-" + (retrievedExpiryDate.getMonth() + 1) + "-" + retrievedExpiryDate.getDate();
                        // If Contact Expiry Date matches what is entered in the Expiry Date in the EWR
                        if (formattedExpiredDate === formattedLicenseExpiryDate) {
                            //If Expiry Date is not Expired, License Number and Expiry Date are valid
                            if (retrievedExpiryDate > new Date()) {
                                // Don't prevent users from saving
                                resolve = true;
                            }
                        }
                    }
                    // If License Number is Invalid
                    if (overrideToggle === true) {
                        resolve = true;
                    }
                    promResolve(resolve);
                },
                function (qlrError) {
                    promReject(reject);
                })
        }
        else if (((licenseNumber === null) || (expiryDate === null)) && (overrideToggle === true)) {
            resolve = true;
            promResolve(resolve);
        }
        else if (((licenseNumber === null) || (expiryDate === null)) && (overrideToggle === false)) {
            resolve = false;
            promResolve(resolve);
        }
    });
};

EQL.WebResource.EWR.notificationMessageFunction = function (notifText, notifTitle) {
    "use strict";
    let alertStrings = { confirmButtonLabel: "OK", text: notifText, title: notifTitle };
    let alertOptions = { height: 120, width: 260 };
    Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
        function (success) {
            // None
        },
        function (error) {
            //None
        }
    );
};

EQL.WebResource.EWR.formLevelNotificationMessageFunction = function (formContext, displayText) {
    "use strict";
    let formType = formContext.ui.getFormType();

    if (formType === 2) {
        formContext.ui.clearFormNotification();
        formContext.ui.setFormNotification(displayText, "INFORMATION");
    }
};

EQL.WebResource.EWR.checkRFTD = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let readyfortestDate = formContext.getAttribute("ava_readyfortestdate").getValue();

    if (readyfortestDate !== null) {

        const today = new Date();
        const currentdate = new Date(today).toISOString().slice(0, 10);
        let futuredate = today.setMonth(today.getMonth() + 3);
        let formattedfuturedate = new Date(futuredate).toISOString().slice(0, 10);
        let formattedrftd = new Date(readyfortestDate).toISOString().slice(0, 10);

        if (currentdate > formattedrftd) {

            let alertStrings = { confirmButtonLabel: "OK", text: "The Ready for Test Date cannot be set in the past.", title: "Invalid Ready for Test Date" };
            let alertOptions = { height: 120, width: 260 };
            Xrm.Navigation.openAlertDialog(alertStrings, alertOptions)
            formContext.ui.setFormNotification("The Ready for Test Date cannot be set in the past.", "ERROR", "invaliddate");
            formContext.ui.clearFormNotification("validdate");

        }
        else if (formattedrftd > formattedfuturedate) {

            let alertStrings = { confirmButtonLabel: "Confirm", text: "The Ready for Test Date selected is greater than 3 months from the current date. Please confirm that this is correct.", title: "Valid Ready for Test Date" };
            let alertOptions = { height: 120, width: 260 };
            Xrm.Navigation.openAlertDialog(alertStrings, alertOptions)
            formContext.ui.setFormNotification("The Ready for Test Date selected is greater than 3 months from the current date. Please confirm that this is correct", "INFORMATION", "validdate");
            formContext.ui.clearFormNotification("invaliddate");
        }
        else {
            formContext.ui.clearFormNotification("invaliddate");
            formContext.ui.clearFormNotification("validdate");
        }

    }
};

EQL.WebResource.EWR.onSaveRFTD = function (executionContext) {
    "use strict";
    const eventArgs = executionContext.getEventArgs();
    const formContext = executionContext.getFormContext();
    let readyfortestDate = formContext.getAttribute("ava_readyfortestdate").getValue();

    const today = new Date();
    const currentdate = new Date(today).toISOString().slice(0, 10);
    let futuredate = today.setMonth(today.getMonth() + 3);
    let formattedfuturedate = new Date(futuredate).toISOString().slice(0, 10);
    let formattedrftd = new Date(readyfortestDate).toISOString().slice(0, 10);

    if (currentdate > formattedrftd) {
        eventArgs.preventDefault();
    }

};

EQL.WebResource.EWR.ewrValidation = function (executionContext) {
    "use strict"
    try {
        const formContext = executionContext.getFormContext();

        //fields
        let primaryServiceSelection = formContext.getAttribute(EQL.WebResource.EWR.Fields.ServiceSelection).getValue();
        let SupplyType = formContext.getControl(EQL.WebResource.EWR.Fields.SupplyType);
        let MainSBDirection = formContext.getControl(EQL.WebResource.EWR.Fields.MainSBDirection);
        let Meters = formContext.getControl(EQL.WebResource.EWR.Fields.Meters);
        let NetworkTariffsRequired = formContext.getControl(EQL.WebResource.EWR.Fields.NetworkTariffsRequired);
        let TotalNoPhasesRequired = formContext.getControl(EQL.WebResource.EWR.Fields.TotalNoPhasesRequired);
        let MaxDemand = formContext.getControl(EQL.WebResource.EWR.Fields.MaxDemand);
        let PolePillarNo = formContext.getControl(EQL.WebResource.EWR.Fields.PolePillarNo);
        let SameDayDropErect = formContext.getControl(EQL.WebResource.EWR.Fields.SameDayDropErect);
        let PropertyPole = formContext.getControl(EQL.WebResource.EWR.Fields.PropertyPole);
        let AdditionalInformationAboutRequest = formContext.getControl(EQL.WebResource.EWR.Fields.AdditionalInformationAboutRequest);
        let BusinessName = formContext.getControl(EQL.WebResource.EWR.Fields.BusinessName);
        let FirstName = formContext.getControl(EQL.WebResource.EWR.Fields.FirstName);
        let LastName = formContext.getControl(EQL.WebResource.EWR.Fields.LastName);
        let MobilePhone = formContext.getControl(EQL.WebResource.EWR.Fields.MobilePhone);
        let HomePhone = formContext.getControl(EQL.WebResource.EWR.Fields.HomePhone);
        let WorkPhone = formContext.getControl(EQL.WebResource.EWR.Fields.WorkPhone);
        let CustomerEmail = formContext.getControl(EQL.WebResource.EWR.Fields.CustomerEmail);
        let ContactPerson = formContext.getControl(EQL.WebResource.EWR.Fields.ContactPerson);
        let PostalAddress = formContext.getControl(EQL.WebResource.EWR.Fields.PostalAddress);
        let OverrideProfile = formContext.getControl(EQL.WebResource.EWR.Fields.OverrideProfile);
        let NotificationEmailAddress = formContext.getControl(EQL.WebResource.EWR.Fields.NotificationEmailAddress);
        let NotificationSMSNumber = formContext.getControl(EQL.WebResource.EWR.Fields.NotificationSMSNumber);

        let MeterLocation = formContext.getControl(EQL.WebResource.EWR.Fields.MeterLocation);
        let MainSwitchboardLocation = formContext.getControl(EQL.WebResource.EWR.Fields.MainSwitchboardLocation);
        let ChangeLocationMeter = formContext.getControl(EQL.WebResource.EWR.Fields.ChangeLocationMeter);
        let CuttingOverNewSB = formContext.getControl(EQL.WebResource.EWR.Fields.CuttingOverNewSB);
        let OtherMeteringDetails = formContext.getControl(EQL.WebResource.EWR.Fields.OtherMeteringDetails);
        let InstallationType = formContext.getControl(EQL.WebResource.EWR.Fields.InstallationType);
        let AnticipateTrafficControl = formContext.getControl(EQL.WebResource.EWR.Fields.AnticipateTrafficControl);
        let SpareFusesinPillar = formContext.getControl(EQL.WebResource.EWR.Fields.SpareFusesinPillar);
        let MultiOccupancy = formContext.getControl(EQL.WebResource.EWR.Fields.MultiOccupancy);

        //tab
        let RetailerDetails = formContext.ui.tabs.get(EQL.WebResource.EWR.Tab.RetailerDetails);
        let CustomerDetails = formContext.ui.tabs.get(EQL.WebResource.EWR.Tab.CustomerDetails);
        let Attachments = formContext.ui.tabs.get(EQL.WebResource.EWR.Tab.Attachments);
        let Declarations = formContext.ui.tabs.get(EQL.WebResource.EWR.Tab.Declarations);
        let MultiUnitDwelling = EQL.WebResource.EWR.PrimaryServiceSelectionText.MultiUnitDwelling;

        if (primaryServiceSelection !== null) {
            let primaryserviceselectionname = primaryServiceSelection[0].name;

            if (primaryserviceselectionname === MultiUnitDwelling) {
                //show fields
                SupplyType.setVisible(true);
                MultiOccupancy.setVisible(true);
                OverrideProfile.setVisible(true);
                NotificationEmailAddress.setVisible(true);
                NotificationSMSNumber.setVisible(true);

                //hide fields
                MainSBDirection.setVisible(false);
                Meters.setVisible(false);
                NetworkTariffsRequired.setVisible(false);
                TotalNoPhasesRequired.setVisible(false);
                MaxDemand.setVisible(false);
                PolePillarNo.setVisible(false);
                SameDayDropErect.setVisible(false);
                PropertyPole.setVisible(false);
                AdditionalInformationAboutRequest.setVisible(false);
                MeterLocation.setVisible(false);
                MainSwitchboardLocation.setVisible(false);
                ChangeLocationMeter.setVisible(false);
                CuttingOverNewSB.setVisible(false);
                OtherMeteringDetails.setVisible(false);
                InstallationType.setVisible(false);
                AnticipateTrafficControl.setVisible(false);
                SpareFusesinPillar.setVisible(false);

                //hide tabs
                RetailerDetails.setVisible(false);
                CustomerDetails.setVisible(false);
                Declarations.setVisible(false);
            }
            else {
                //show fields
                SupplyType.setVisible(true);
                MultiOccupancy.setVisible(true);
                MainSBDirection.setVisible(true);
                Meters.setVisible(true);
                NetworkTariffsRequired.setVisible(true);
                TotalNoPhasesRequired.setVisible(true);
                MaxDemand.setVisible(true);
                PolePillarNo.setVisible(true);
                SameDayDropErect.setVisible(true);
                PropertyPole.setVisible(true);
                AdditionalInformationAboutRequest.setVisible(true);
                BusinessName.setVisible(true);
                FirstName.setVisible(true);
                LastName.setVisible(true);
                MobilePhone.setVisible(true);
                HomePhone.setVisible(true);
                WorkPhone.setVisible(true);
                CustomerEmail.setVisible(true);
                ContactPerson.setVisible(true);
                PostalAddress.setVisible(true);
                NotificationEmailAddress.setVisible(true);
                NotificationSMSNumber.setVisible(true);
                MeterLocation.setVisible(true);
                MainSwitchboardLocation.setVisible(true);
                ChangeLocationMeter.setVisible(true);
                CuttingOverNewSB.setVisible(true);
                OtherMeteringDetails.setVisible(true);
                InstallationType.setVisible(true);
                AnticipateTrafficControl.setVisible(true);
                SpareFusesinPillar.setVisible(true);

                //show tabs
                RetailerDetails.setVisible(true);
                CustomerDetails.setVisible(true);
                Attachments.setVisible(true);
                Declarations.setVisible(true);
            }
        }
    } catch (e) {
        alert(e.message);
    }
}

EQL.WebResource.EWR.ewrSupplyType = function (executionContext) {
    "use strict"
    try {
        const formContext = executionContext.getFormContext();

        //fields
        let primaryServiceSelection = formContext.getAttribute(EQL.WebResource.EWR.Fields.ServiceSelection).getValue();
        let SupplyType = formContext.getAttribute(EQL.WebResource.EWR.Fields.SupplyType);
        let OverheadPointAttachmentRelocation = EQL.WebResource.EWR.PrimaryServiceSelectionText.OverheadPointAttachmentRelocation;
        let ChangefromOverheadToUnderground = EQL.WebResource.EWR.PrimaryServiceSelectionText.ChangefromOverheadToUnderground;
        let PrimaryFuseUpgrade = EQL.WebResource.EWR.PrimaryServiceSelectionText.PrimaryFuseUpgrade;
        let RelocateUndergroundMainPillars = EQL.WebResource.EWR.PrimaryServiceSelectionText.RelocateUndergroundMainPillars;
        let SupplyTypeControl = formContext.getControl(EQL.WebResource.EWR.Fields.SupplyType);

        if (primaryServiceSelection === null) {
            SupplyType.setValue(null);
            SupplyTypeControl.setDisabled(false);
            return;
        } else {
            let primaryServiceSelection_name = formContext.getAttribute(EQL.WebResource.EWR.Fields.ServiceSelection).getValue()[0].name;
            if (primaryServiceSelection_name === OverheadPointAttachmentRelocation || primaryServiceSelection_name === ChangefromOverheadToUnderground || primaryServiceSelection_name === PrimaryFuseUpgrade) {
                SupplyType.setValue(768610000);
                SupplyTypeControl.setDisabled(true);
            }
            else if (primaryServiceSelection_name === RelocateUndergroundMainPillars) {
                SupplyType.setValue(768610001);
                SupplyTypeControl.setDisabled(true);
            }
            else {
                SupplyType.setValue(null);
                SupplyTypeControl.setDisabled(false);
            }
        }

    } catch (e) {
        alert(e.message);
    }
};

EQL.WebResource.EWR.ewrSupplyTypeOnLoad = function (executionContext) {
    "use strict"
    try {
        const formContext = executionContext.getFormContext();

        //fields
        let primaryServiceSelection = formContext.getAttribute(EQL.WebResource.EWR.Fields.ServiceSelection).getValue();
        let SupplyType = formContext.getAttribute(EQL.WebResource.EWR.Fields.SupplyType);
        let OverheadPointAttachmentRelocation = EQL.WebResource.EWR.PrimaryServiceSelectionText.OverheadPointAttachmentRelocation;
        let ChangefromOverheadToUnderground = EQL.WebResource.EWR.PrimaryServiceSelectionText.ChangefromOverheadToUnderground;
        let PrimaryFuseUpgrade = EQL.WebResource.EWR.PrimaryServiceSelectionText.PrimaryFuseUpgrade;
        let RelocateUndergroundMainPillars = EQL.WebResource.EWR.PrimaryServiceSelectionText.RelocateUndergroundMainPillars;
        let SupplyTypeControl = formContext.getControl(EQL.WebResource.EWR.Fields.SupplyType);

        if (primaryServiceSelection === null) {
            SupplyType.setValue(null);
            SupplyTypeControl.setDisabled(false);
            return;
        } else {
            let primaryServiceSelection_name = formContext.getAttribute(EQL.WebResource.EWR.Fields.ServiceSelection).getValue()[0].name;
            if (primaryServiceSelection_name === OverheadPointAttachmentRelocation || primaryServiceSelection_name === ChangefromOverheadToUnderground || primaryServiceSelection_name === PrimaryFuseUpgrade) {
                SupplyTypeControl.setDisabled(true);
            }
            else if (primaryServiceSelection_name === RelocateUndergroundMainPillars) {
                SupplyTypeControl.setDisabled(true);
            }
            else {
                SupplyTypeControl.setDisabled(false);
            }
        }


    } catch (e) {
        throw e.message;
    }
};

EQL.WebResource.EWR.filterSecondaryServiceSelection = function (executionContext) {
    "use strict";
    var formContext = executionContext.getFormContext();
    var secondarySelectionControl = formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection);
    var secondarySelectionAttribute = formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection);
    var primaryserviceselection = formContext.getAttribute(EQL.WebResource.EWR.Fields.PrimaryServiceSelection).getValue();
    var secondaryServiceSelectionOptionValues = EQL.WebResource.EWR.OptionSet.SecondaryServiceSelections;

    if (primaryserviceselection !== null) {
        var primaryserviceselectionname = primaryserviceselection[0].name;

        if (primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.PermanentSupply ||
            primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.AdditionalShopUnit) {
            formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(true);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("required");

            //Hide non - related options for Permanent Supply and Additional Shop Unit
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.AddApplianceToExistingControlledLoadMeter);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.POARelocation);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ExchangeMeter);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.RemoveMeterInclHWOrControlLoad);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.RelocateMeter);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.DropAndReErectService);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ChangefromOverheadToUnderground);
        }
        else if (primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.SupplyUpgrade) {
            formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(true);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("required");

            if (secondarySelectionAttribute.getOptions().length >= 1) {
                //Hide all options
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.AddApplianceToExistingControlledLoadMeter);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.AddMeter_HWorControlLoad);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.POARelocation);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ExchangeMeter);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.RemoveMeterInclHWOrControlLoad);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.RelocateMeter);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.DropAndReErectService);
                secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ChangefromOverheadToUnderground);
            }
            //Show all options
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.POARelocation));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.AddMeter_HWorControlLoad));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.AddApplianceToExistingControlledLoadMeter));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.ExchangeMeter));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.RemoveMeterInclHWOrControlLoad));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.RelocateMeter));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.DropAndReErectService));
            secondarySelectionControl.addOption(secondarySelectionAttribute.getOption(secondaryServiceSelectionOptionValues.ChangefromOverheadToUnderground));


        }
        else if (primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.OverheadPointofAttachmentRelocation) {
            formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(true);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("required");

            //Hide non - related options for Overhead Point of Attachment Relocation
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.POARelocation);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ChangefromOverheadToUnderground);
        }
        else if (primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.ChangefromOverheadToUnderground ||
            primaryserviceselectionname === EQL.WebResource.EWR.PrimaryServiceSelectionText.InstallAdditionalPhases) {
            formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(true);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("required");

            //Hide non - related options for Change from Overhead to Underground and Install Additional Phases
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.ChangefromOverheadToUnderground);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.DropAndReErectService);
            secondarySelectionControl.removeOption(secondaryServiceSelectionOptionValues.POARelocation);
        }
        else {
            //Clear Secondary Service Selection if no primary service selection associated on it
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setValue(null);
            formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(false);
            formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("none");
        }

    } else {
        //Clear selected Secondary Service Selection and hide field
        formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setValue(null);
        formContext.getControl(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setVisible(false);
        formContext.getAttribute(EQL.WebResource.EWR.Fields.SecondaryServiceSelection).setRequiredLevel("none");
    }
};

EQL.WebResource.EWR.setDeclarationLabel = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();

    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration1).setLabel("The inverter has been installed in compliance with the Connection Standard STNW1170 and commissioned with the prescribed inverter settings");
    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration2).setLabel("The embedded generating system has been tested and deemed safe for connection to Ergon Energy's Distribution Network");
    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration3).setLabel("All required meter isolation links are installed, and meter board hinged as per QECM & QEMM requirements");
    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration4).setLabel("Inverter capacity >10 kVA has been spread over multiple phases");
    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration5).setLabel("For multi-phase installations the capacity difference per phase does not exceed 5 kVA");
    formContext.getControl(EQL.WebResource.EWR.Fields.Declaration6).setLabel("For connections approved for connection with export limits, the export limit settings have been applied to the embedded generating system");

};

EQL.WebResource.EWR.onchangeConnectApplication = function (executionContext) {
    "use strict";
    const formContext = executionContext.getFormContext();
    let connectApplication = formContext.getAttribute(EQL.WebResource.EWR.Fields.ConnectApplication).getValue();

    // If Connect Application has value
    if (connectApplication !== null) {
        connectApplication = connectApplication[0].id.replace("{", "").replace("}", "");

        Xrm.WebApi.online.retrieveRecord("ava_connectapplication", connectApplication, "?$select=ava_poleorpillarno,ava_maxdemand,ava_supplytype").then(
            function success(result) {
                formContext.getAttribute(EQL.WebResource.EWR.Fields.MaxDemand).setValue(result["ava_maxdemand"]);
                //formContext.getAttribute(EQL.WebResource.EWR.Fields.TotalNoPhasesRequired).setValue(result["ava_requiredas3000maximumdemand"]);
                //formContext.getAttribute(EQL.WebResource.EWR.Fields.MultiOccupancy).setValue(result["ava_polepillarno"]);
                formContext.getAttribute(EQL.WebResource.EWR.Fields.SupplyType).setValue(result["ava_supplytype"]);
                formContext.getAttribute(EQL.WebResource.EWR.Fields.PolePillarNo).setValue(result["ava_poleorpillarno"]);

            },
            function (error) {
                Xrm.Utility.alertDialog("Error on populating Metering and Load details. Error Message: " + error.message);
            }
        );
    }
};