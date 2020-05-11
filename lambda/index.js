// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const https = require('https');
var request = require("request");
var coronautils = require('./coronautils');
var moment = require('moment');
var _ = require('lodash');


var allData = {};
var districtData = {};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        getJSON(function (data) {
            if (data != "ERROR") {
                allData = data;
            }
        });
        getJSONDistricData(function (data) {
            if (data != "ERROR") {
                districtData = data;
            }
        });

        const speakOutput = 'Try asking me Cases in Delhi<break time="150ms"/>Gurugram or <break time="500ms"/> Rise in cases in Delhi or <break time="500ms"/> Samples tested in india';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const TotalConfirmedCases_Handler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'TotalConfirmedCases';
    },
    handle(handlerInput) {
        checkAndUpdateApiData();
        var activeCases = 0
        try {
            if (allData && allData.statewise && allData.statewise[0]) {
                activeCases = allData.statewise[0].confirmed;
            }
            return handlerInput.responseBuilder
                .speak("The Total cases in india are " + activeCases)
                .reprompt("Try asking total cases in Delhi")
                .getResponse();


        } catch (error) {
            handlerInput.responseBuilder
                .speak(`I wasn't able to get api data`)
                .getResponse();

        }
    }
};


const CasesInState_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'CasesInStates';
    },
    handle(handlerInput) {

        checkAndUpdateApiData();

        var caseInState = 0;
        var stateData = {};
        var location = handlerInput.requestEnvelope.request.intent.slots.state.value;
        if (location) {
            stateData = findDataByStateName(location);

            if (!stateData) {
                stateData = findDataInDistrict(location)
            }
        }
        else {
            //return data for district.
            // stateData = findDataInDistrict(location)
        }

        if (stateData && stateData.confirmed) {
            caseInState = stateData.confirmed;
        }

        try {
            return handlerInput.responseBuilder
                .speak("The Total cases in " + location + " are  " + caseInState)
                .reprompt("Try saying Corona cases in Delhi")
                .getResponse();


        } catch (error) {
            handlerInput.responseBuilder
                .speak(`I wasn't able to get api data`)
                .getResponse();

        }
    }
};


const RiseInCases_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RiseInCases';
    },
    handle(handlerInput) {

        checkAndUpdateApiData();

        var riseInCases = 0;
        var stateData = {};
        var state = handlerInput.requestEnvelope.request.intent.slots.state.value;
        if (state) {
            stateData = findDataByStateName(state);
        }
        else {
            //return data for india.
            stateData = findDataByStateName("Total");
            state = "India"
        }

        if (stateData && stateData.deltaconfirmed) {
            riseInCases = stateData.deltaconfirmed;
        }

        try {
            return handlerInput.responseBuilder
                .speak("The Total Rise in cases in " + state + " are  " + riseInCases)
                .reprompt("Want to know more data ?")
                .getResponse();


        } catch (error) {
            handlerInput.responseBuilder
                .speak(`I wasn't able to get api data`)
                .getResponse();

        }
    }
};


const TestingStats_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'TestingStatsIntent';
    },
    handle(handlerInput) {

        checkAndUpdateApiData();

        let say = "";
        if (allData && allData.tested && allData.tested.length > 0) {
            var lastDateData = allData.tested[allData.tested.length - 1];
            if (lastDateData) {
                var totalSamplesTested = lastDateData.totalsamplestested;
                var lastTestedDate = lastDateData.updatetimestamp;
                var dateObj = moment(lastTestedDate, "DD/MM/YYYY hh:mm:ss")
                var monthName = coronautils.getMonthName(dateObj);

                say = "Samples tested as of " + dateObj.format('Do') + " " + monthName + " are " + totalSamplesTested;
            } else {
                say = "Data Not Found";
            }
        } else {
            say = "Sample Testing Data not present"
        }
        try {
            return handlerInput.responseBuilder
                .speak(say)
                .reprompt("Try saying Samples tested in india")
                .getResponse();


        } catch (error) {
            handlerInput.responseBuilder
                .speak(`I wasn't able to get api data`)
                .getResponse();

        }
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Ask me total Active cases or todays rise in cases , or get cases for Delhi ';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Stay home stay safe';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


/** Covid Helper Functions for Getting API data **/
function checkAndUpdateApiData() {
    if (!allData || !allData.statewise) {
        getJSON(function (data) {
            if (data != "ERROR") {
                allData = data;
            }
        });
    }

}

function getJSON(callback) {
    // HTTP - covid 19 india.org
    request.get("https://api.covid19india.org/data.json", function (error, response, body) {
        var d = JSON.parse(body)
        var result = d;
        allData = result;
        callback(result);
    })
}

function getJSONDistricData(callback) {
    // HTTP - covid 19 india.org
    request.get("https://api.covid19india.org/state_district_wise.json", function (error, response, body) {
        var d = JSON.parse(body)
        allData = d;
        callback(d);
    })
}

var findDataByStateCode = function (queryStateCode) {
    if (allData && allData.statewise) {
        var index = allData.statewise.findIndex(p => p.statecode == queryStateCode)
        return allData.statewise[index];
    }
}

var findDataByStateName = function (queryStateName) {
    if (allData && allData.statewise) {
        var index = allData.statewise.findIndex(p => p.state.toLowerCase() == queryStateName.toLowerCase())
        return allData.statewise[index];
    }
}

var findDataInDistrict = function (queryDistName) {
    var dataFound = false;
    var finalRes = {};
    if (districtData) {

        for (var key in districtData) {

            if (districtData.hasOwnProperty(key)) {

                dataFound = false;
                var currState = districtData[key].districtData;
                var districtSrcRes = _.find(currState, function (district, index) {
                    console.log("\n\nkey =", district);
                    console.log("\n\nINdex =", index)
                    if(index.toLowerCase()==queryDistName.toLowerCase()) {
                        dataFound =true;
                        return true;
                    }
                });

                if (dataFound) {
                    finalRes = districtSrcRes;
                    break;
                }
            }
        }
    }
    return finalRes;
}



var findStateCodeByName = function (stateName) {

}

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        TotalConfirmedCases_Handler,
        CasesInState_Handler,
        RiseInCases_Handler,
        TestingStats_Handler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();